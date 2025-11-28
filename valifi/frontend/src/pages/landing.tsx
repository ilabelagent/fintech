import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
  Globe,
  Lock,
  Award,
  Coins,
  LineChart,
  Bot,
  Wallet,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  CreditCard,
  Users,
  Database,
  Activity,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/login');
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Trading',
      description:
        'Advanced autonomous trading bots with machine learning algorithms for optimal execution and risk management.',
    },
    {
      icon: Wallet,
      title: 'Multi-Chain Wallets',
      description:
        'Secure wallet management across Ethereum, Polygon, BSC, Arbitrum, and Optimism networks.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'Bank-grade encryption, multi-signature authentication, and comprehensive KYC/AML compliance.',
    },
    {
      icon: LineChart,
      title: 'Real-Time Analytics',
      description:
        'Advanced portfolio analytics, market insights, and performance tracking in real-time.',
    },
    {
      icon: Coins,
      title: 'Precious Metals',
      description:
        'Trade and invest in physical gold, silver, platinum with blockchain-verified certificates.',
    },
    {
      icon: CreditCard,
      title: 'Instant Payments',
      description:
        'Seamless fiat and crypto payments with support for multiple processors and instant settlement.',
    },
    {
      icon: TrendingUp,
      title: 'DeFi Integration',
      description:
        'Access liquidity pools, yield farming, and decentralized exchange protocols from one platform.',
    },
    {
      icon: Lock,
      title: 'Regulatory Compliance',
      description:
        'Full compliance with international financial regulations and transparent reporting.',
    },
    {
      icon: BarChart3,
      title: 'Professional Trading',
      description:
        'Advanced order types, algorithmic strategies, and institutional-grade execution.',
    },
  ];

  const stats = [
    { value: '$10B+', label: 'Assets Secured' },
    { value: '5', label: 'Blockchain Networks' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '24/7', label: 'Support' },
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$0',
      description: 'Perfect for individuals getting started',
      features: [
        'Multi-chain wallet management',
        'Basic trading features',
        'Standard market data',
        'Email support',
        'Mobile & web access',
      ],
    },
    {
      name: 'Professional',
      price: '$49',
      description: 'For active traders and investors',
      features: [
        'Everything in Starter',
        'Advanced trading bots',
        'Real-time market analytics',
        'Priority support',
        'API access',
        'Advanced order types',
      ],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For institutions and high-volume traders',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'White-label solutions',
        'SLA guarantees',
        'Advanced security features',
      ],
    },
  ];

  return (
    <div className="min-h-screen cyber-bg text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Valifi
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleLearnMore}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Button>
              <Button
                onClick={handleGetStarted}
                size="sm"
                className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
              >
                Get Started
              </Button>
            </div>
            <div className="md:hidden">
              <Button
                onClick={handleGetStarted}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20"></div>

        <motion.div
          className="max-w-7xl mx-auto text-center relative z-10"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Financial Platform</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent px-4"
          >
            Next-Generation
            <br />
            Financial Platform
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 px-4 leading-relaxed"
          >
            Harness the power of AI-driven trading, multi-chain blockchain integration, and
            institutional-grade security for your digital assets.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16 px-4"
          >
            <Button
              size="lg"
              className="cyber-button text-base sm:text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
              onClick={handleGetStarted}
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="cyber-button text-base sm:text-lg px-8 py-6 font-medium transition-all"
              onClick={handleLearnMore}
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto px-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Vision Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
        <div className="absolute inset-0 matrix-rain"></div>{' '}
        {/* Optional: Add matrix rain effect */}
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 sm:mb-16"
          >
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 glitch neon-cyan"
              data-text="Our Vision"
            >
              Our Vision
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              To forge the future of finance, empowering individuals and institutions with
              intelligent, secure, and decentralized tools for wealth creation and management in the
              digital economy.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="cyber-card p-6 rounded-xl cyber-glow-cyan h-full flex flex-col justify-between"
            >
              <div>
                <Award className="w-10 h-10 neon-cyan mb-4" />
                <h3 className="text-xl font-bold neon-cyan mb-2">Innovation Driven</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Pioneering cutting-edge AI and blockchain technologies to redefine financial
                  services.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="cyber-card p-6 rounded-xl cyber-glow-magenta h-full flex flex-col justify-between"
            >
              <div>
                <Users className="w-10 h-10 neon-magenta mb-4" />
                <h3 className="text-xl font-bold neon-magenta mb-2">User Centric</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Crafting intuitive and powerful experiences that put our users at the core of
                  their financial journey.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="cyber-card p-6 rounded-xl cyber-glow-green h-full flex flex-col justify-between"
            >
              <div>
                <Database className="w-10 h-10 neon-green mb-4" />
                <h3 className="text-xl font-bold neon-green mb-2">Security Paramount</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Implementing multi-layered security protocols to safeguard every asset and
                  transaction.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
              Everything you need to manage, trade, and grow your digital assets
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full cyber-card cyber-glow-cyan">
                  <CardHeader className="pb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground neon-cyan">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-blue-50/20 to-purple-50/20 dark:via-blue-950/10 dark:to-purple-950/10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
              Choose the plan that fits your needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <Card
                  className={`h-full flex flex-col cyber-card ${tier.highlighted ? 'border-blue-500 border-2 shadow-2xl scale-105 relative cyber-glow-cyan' : 'border-2 border-border'} bg-card transition-all duration-300`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full shadow-lg pulse-neon">
                        Most Popular
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-6 pt-8">
                    <CardTitle className="text-2xl font-bold text-foreground neon-cyan">
                      {tier.name}
                    </CardTitle>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {tier.price}
                      </span>
                      {tier.price !== 'Custom' && (
                        <span className="ml-2 text-muted-foreground font-medium">/month</span>
                      )}
                    </div>
                    <CardDescription className="mt-3 text-base leading-relaxed">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <ul className="space-y-3 mb-6 flex-grow">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full cyber-button ${tier.highlighted ? 'neon-cyan' : ''}`}
                      size="lg"
                      variant={tier.highlighted ? 'default' : 'outline'}
                      onClick={handleGetStarted}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="cyber-card cyber-glow-magenta rounded-2xl p-8 sm:p-12 lg:p-16 border-2 border-blue-100 dark:border-blue-900/30"
          >
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 glitch neon-magenta"
              data-text="Ready to get started?"
            >
              Ready to get started?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-4 leading-relaxed">
              Join thousands of users managing their digital assets with Valifi
            </p>
            <Button
              size="lg"
              className="cyber-button text-base sm:text-lg px-8 sm:px-12 py-6 shadow-xl hover:shadow-2xl transition-all"
              onClick={handleGetStarted}
            >
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Valifi
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Professional financial platform for the digital age.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Product</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Company</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2024 Valifi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
