import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Shield, 
  TrendingUp, 
  Zap, 
  Globe, 
  Lock, 
  Award,
  Coins,
  Wallet,
  ArrowRightLeft,
  CreditCard,
  Building,
  UserCheck,
  DollarSign,
  LineChart,
  Sparkles,
  CheckCircle
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/login");
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-8 bg-gradient-to-br from-primary/5 via-background to-purple-950/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(215,37,84,0.1),transparent_50%)]"></div>
        
        <motion.div 
          className="max-w-7xl mx-auto text-center relative z-10"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent"
          >
            Valifi
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-2xl md:text-3xl font-medium text-foreground max-w-3xl mx-auto mb-4"
          >
            Your Complete Financial Universe
          </motion.p>

          <motion.p 
            variants={fadeInUp}
            className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12"
          >
            Unified, Secure, Intelligent - Trade, invest, and manage all your assets across traditional and digital finance in one powerful platform.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-primary text-white hover:bg-primary/90 font-semibold text-lg px-8 py-6"
              onClick={handleGetStarted}
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRightLeft className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary/50 text-foreground hover:bg-primary/10 text-lg px-8 py-6"
              onClick={handleLearnMore}
              data-testid="button-learn-more"
            >
              Explore Features
            </Button>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-border/50"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">150+</p>
              <p className="text-sm text-muted-foreground">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">$2.5B+</p>
              <p className="text-sm text-muted-foreground">Assets Managed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Core Services */}
      <section id="features" className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Complete Financial Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage, grow, and protect your wealth in one integrated platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ArrowRightLeft className="w-8 h-8" />,
                title: "Exchange",
                description: "Trade cryptocurrencies with institutional-grade security, real-time data, and competitive fees.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "P2P Trading",
                description: "Connect directly with buyers and sellers worldwide with escrow-protected transactions.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: <LineChart className="w-8 h-8" />,
                title: "Portfolio & Assets",
                description: "Track all your investments across crypto, precious metals, and fiat with real-time analytics.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Payments",
                description: "Send and receive funds instantly across borders with low fees and enterprise security.",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: <DollarSign className="w-8 h-8" />,
                title: "Loans",
                description: "Access liquidity with crypto-backed loans featuring competitive rates and instant approval.",
                color: "from-red-500 to-pink-500"
              },
              {
                icon: <UserCheck className="w-8 h-8" />,
                title: "KYC Verification",
                description: "One-time streamlined verification for full platform access and regulatory compliance.",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: <Coins className="w-8 h-8" />,
                title: "Precious Metals",
                description: "Invest in physical gold and silver with digital convenience and allocated storage.",
                color: "from-amber-500 to-yellow-500"
              },
              {
                icon: <Building className="w-8 h-8" />,
                title: "Bank Accounts",
                description: "Link your traditional bank accounts for seamless fiat integration and transfers.",
                color: "from-slate-500 to-gray-500"
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "Valifi Cards",
                description: "Spend your assets anywhere with virtual and physical cards, plus cashback rewards.",
                color: "from-rose-500 to-red-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group" data-testid={`feature-card-${index}`}>
                  <CardHeader>
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20 px-8 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Shield className="w-16 h-16 mx-auto text-primary mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built on Trust
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Bank-level security meets blockchain innovation to protect your assets
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: <Lock className="w-6 h-6" />,
                title: "Multi-Layer Security",
                description: "Military-grade encryption and cold storage"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "24/7 Monitoring",
                description: "Real-time threat detection and response"
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                title: "Regulatory Compliance",
                description: "Full KYC/AML compliance worldwide"
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: "Insured Assets",
                description: "Industry-leading insurance coverage"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center border-border/50">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Take Control of Your Financial Future?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users managing their wealth on Valifi
            </p>
            <Button 
              size="lg" 
              className="bg-primary text-white hover:bg-primary/90 font-semibold text-lg px-10 py-6"
              onClick={handleGetStarted}
              data-testid="button-cta-get-started"
            >
              Open Your Account
              <ArrowRightLeft className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              Free to join • No hidden fees • Full transparency
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-primary">Valifi</h3>
              <p className="text-sm text-muted-foreground">
                Your complete financial universe - unified, secure, intelligent.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Exchange</li>
                <li>P2P Trading</li>
                <li>Payments</li>
                <li>Loans</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Precious Metals</li>
                <li>Bank Accounts</li>
                <li>Valifi Cards</li>
                <li>KYC Verification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Security</li>
                <li>Compliance</li>
                <li>Support</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Valifi. All rights reserved.</p>
            <p className="mt-2">
              Cryptocurrency investments carry risk. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
