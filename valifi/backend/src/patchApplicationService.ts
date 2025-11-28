/**
 * Patch Application Service
 *
 * Applies code patches to the codebase with rollback capability.
 * Creates backups before applying patches for safe recovery.
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { CodePatch, AgentSolution } from './multiAgentPatchService';

const execAsync = promisify(exec);

export interface PatchApplication {
  id: string;
  timestamp: Date;
  patches: CodePatch[];
  status: 'pending' | 'applying' | 'applied' | 'failed' | 'rolled_back';
  backupPath: string;
  result?: {
    success: boolean;
    appliedPatches: string[];
    failedPatches: Array<{ file: string; error: string }>;
    duration: number;
  };
}

export class PatchApplicationService {
  private readonly backupDir = path.join(process.cwd(), '.patch-backups');
  private applications: PatchApplication[] = [];

  constructor() {
    this.ensureBackupDir();
  }

  /**
   * Apply patches from an agent solution
   */
  async applyPatches(solution: AgentSolution): Promise<PatchApplication> {
    const application: PatchApplication = {
      id: this.generateId(),
      timestamp: new Date(),
      patches: solution.solution.patches,
      status: 'pending',
      backupPath: path.join(this.backupDir, `backup_${Date.now()}`),
    };

    this.applications.push(application);
    console.log(`[PatchApplication] Starting application ${application.id}`);

    const startTime = Date.now();

    try {
      // Update status
      application.status = 'applying';

      // Create backup
      await this.createBackup(application);

      // Apply each patch
      const appliedPatches: string[] = [];
      const failedPatches: Array<{ file: string; error: string }> = [];

      for (const patch of application.patches) {
        try {
          await this.applyPatch(patch);
          appliedPatches.push(patch.file);
          console.log(`[PatchApplication] Applied patch to ${patch.file}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          failedPatches.push({ file: patch.file, error: errorMsg });
          console.error(`[PatchApplication] Failed to apply patch to ${patch.file}:`, errorMsg);
        }
      }

      // Determine overall success
      const success = failedPatches.length === 0;
      application.status = success ? 'applied' : 'failed';

      application.result = {
        success,
        appliedPatches,
        failedPatches,
        duration: Date.now() - startTime,
      };

      console.log(
        `[PatchApplication] ${success ? 'Successfully' : 'Partially'} applied ${appliedPatches.length}/${application.patches.length} patches`
      );

      return application;
    } catch (error) {
      application.status = 'failed';
      application.result = {
        success: false,
        appliedPatches: [],
        failedPatches: [{ file: 'system', error: String(error) }],
        duration: Date.now() - startTime,
      };

      console.error('[PatchApplication] Application failed:', error);
      throw error;
    }
  }

  /**
   * Rollback a patch application
   */
  async rollback(applicationId: string): Promise<boolean> {
    const application = this.applications.find((a) => a.id === applicationId);

    if (!application) {
      throw new Error(`Application not found: ${applicationId}`);
    }

    if (application.status !== 'applied' && application.status !== 'failed') {
      throw new Error(`Cannot rollback application in status: ${application.status}`);
    }

    console.log(`[PatchApplication] Rolling back ${applicationId}`);

    try {
      // Restore from backup
      await this.restoreBackup(application);

      application.status = 'rolled_back';
      console.log(`[PatchApplication] Successfully rolled back ${applicationId}`);

      return true;
    } catch (error) {
      console.error('[PatchApplication] Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get application history
   */
  getApplicationHistory(): PatchApplication[] {
    return [...this.applications];
  }

  /**
   * Get application by ID
   */
  getApplication(id: string): PatchApplication | undefined {
    return this.applications.find((a) => a.id === id);
  }

  /**
   * Apply a single patch
   */
  private async applyPatch(patch: CodePatch): Promise<void> {
    const filePath = path.join(process.cwd(), patch.file);

    switch (patch.action) {
      case 'create':
        await this.createFile(filePath, patch.newContent || '');
        break;

      case 'modify':
        await this.modifyFile(filePath, patch);
        break;

      case 'delete':
        await this.deleteFile(filePath);
        break;

      default:
        throw new Error(`Unknown patch action: ${patch.action}`);
    }
  }

  /**
   * Create a new file
   */
  private async createFile(filePath: string, content: string): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      throw new Error(`File already exists: ${filePath}`);
    }

    // Write file
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Modify an existing file
   */
  private async modifyFile(filePath: string, patch: CodePatch): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    if (patch.newContent) {
      // Replace entire file
      fs.writeFileSync(filePath, patch.newContent, 'utf-8');
    } else if (patch.lineStart !== undefined && patch.lineEnd !== undefined) {
      // Replace specific lines
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Validate line numbers
      if (patch.lineStart < 1 || patch.lineEnd > lines.length) {
        throw new Error(`Invalid line range: ${patch.lineStart}-${patch.lineEnd}`);
      }

      // Replace lines
      const newLines = [
        ...lines.slice(0, patch.lineStart - 1),
        ...(patch.newContent || '').split('\n'),
        ...lines.slice(patch.lineEnd),
      ];

      fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    } else {
      throw new Error('Modify patch must specify newContent or line range');
    }
  }

  /**
   * Delete a file
   */
  private async deleteFile(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      console.warn(`File already deleted: ${filePath}`);
      return;
    }

    fs.unlinkSync(filePath);
  }

  /**
   * Create backup of affected files
   */
  private async createBackup(application: PatchApplication): Promise<void> {
    const backupPath = application.backupPath;

    // Create backup directory
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Backup each file that will be modified
    for (const patch of application.patches) {
      if (patch.action === 'create') {
        continue; // No need to backup new files
      }

      const filePath = path.join(process.cwd(), patch.file);

      if (fs.existsSync(filePath)) {
        const backupFilePath = path.join(backupPath, patch.file);
        const backupFileDir = path.dirname(backupFilePath);

        // Ensure backup directory exists
        if (!fs.existsSync(backupFileDir)) {
          fs.mkdirSync(backupFileDir, { recursive: true });
        }

        // Copy file to backup
        fs.copyFileSync(filePath, backupFilePath);
      }
    }

    // Save application metadata
    const metadataPath = path.join(backupPath, 'metadata.json');
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(
        {
          id: application.id,
          timestamp: application.timestamp,
          patches: application.patches.map((p) => ({
            file: p.file,
            action: p.action,
            description: p.description,
          })),
        },
        null,
        2
      ),
      'utf-8'
    );

    console.log(`[PatchApplication] Created backup at ${backupPath}`);
  }

  /**
   * Restore from backup
   */
  private async restoreBackup(application: PatchApplication): Promise<void> {
    const backupPath = application.backupPath;

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupPath}`);
    }

    // Restore each file
    for (const patch of application.patches) {
      const backupFilePath = path.join(backupPath, patch.file);
      const filePath = path.join(process.cwd(), patch.file);

      if (patch.action === 'create') {
        // Delete created file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else if (fs.existsSync(backupFilePath)) {
        // Restore modified/deleted file
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        fs.copyFileSync(backupFilePath, filePath);
      }
    }

    console.log(`[PatchApplication] Restored from backup ${backupPath}`);
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Add to .gitignore if not already there
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
      if (!gitignore.includes('.patch-backups')) {
        fs.appendFileSync(gitignorePath, '\n.patch-backups/\n');
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const patchApplicationService = new PatchApplicationService();
