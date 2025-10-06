'use client';

import Link from 'next/link';
import { ShieldCheck, Sparkles, BarChart2, ArrowRight, Bot, MessageSquare, ScanSearch, Check } from 'lucide-react';
// FIXED: Added AnimatePresence to the import
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Data for sections - easy to update
const features = [
  {
    name: 'In-Depth Red Flag Analysis',
    description: 'Our AI detects subtle manipulation tactics, financial scam indicators, and inconsistencies that are easy to miss.',
    icon: ShieldCheck,
  },
  {
    name: 'Positive Sign Recognition',
    description: 'It’s not all negative. We highlight green flags that show genuine interest, respect, and emotional availability.',
    icon: Sparkles,
  },
  {
    name: 'Communication Balance',
    description: 'Get a clear picture of the conversation’s give-and-take. See who is putting in more effort and asking more questions.',
    icon: BarChart2,
  },
];

const howItWorksSteps = [
    {
        icon: ScanSearch,
        title: '1. Upload Anonymously',
        description: 'Paste your chat text or upload a screenshot. All personal information is automatically redacted on your device.'
    },
    {
        icon: Bot,
        title: '2. AI Analyzes Context',
        description: 'Our AI reads the entire conversation, analyzing tone, context, and patterns from start to finish.'
    },
    {
        icon: Check,
        title: '3. Get Your Safety Report',
        description: 'Receive an instant, easy-to-read report with a risk score, detailed flag explanations, and actionable advice.'
    }
];

const faqs = [
    {
        question: "Is my data private and secure?",
        answer: "Absolutely. Privacy is our top priority. Screenshots are processed securely and never stored on our servers. The AI analysis is performed by trusted partners like OpenAI under strict data-privacy policies."
    },
    {
        question: "How accurate is the AI analysis?",
        answer: "Our AI is trained on thousands of examples of both safe and manipulative conversations. While it's incredibly accurate at detecting known patterns, it should be used as a powerful second opinion to supplement your own intuition, not replace it."
    },
    {
        question: "Which dating apps does this work with?",
        answer: "Swipe Safe works with screenshots from any dating app or messaging platform, including Tinder, Bumble, Hinge, WhatsApp, iMessage, and more. As long as it's a text conversation, our AI can analyze it."
    },
    {
        question: "Is this service free?",
        answer: "Yes, Swipe Safe offers a generous free plan that allows you to perform a number of analyses every month. We may introduce premium features for power users in the future."
    }
]

const AppLogos = () => (
    <div className="mt-12 flex justify-center items-center gap-x-8 sm:gap-x-12 grayscale opacity-60">
        <img className="h-8 sm:h-10" src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Tinder_logo_2017.svg/1024px-Tinder_logo_2017.svg.png" alt="Tinder" />
        <img className="h-8 sm:h-10" src="https://upload.wikimedia.org/wikipedia/en/thumb/5/58/Bumble_logo_2023.svg/1200px-Bumble_logo_2023.svg.png" alt="Bumble" />
        <img className="h-7 sm:h-9" src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hinge_logo.svg/1200px-Hinge_logo.svg.png" alt="Hinge" />
        <img className="h-8 sm:h-10" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1024px-WhatsApp.svg.png" alt="WhatsApp" />
        <img className="h-8 sm:h-10" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/IMessage_logo_2020.svg/1024px-IMessage_logo_2020.svg.png" alt="iMessage" />
    </div>
)

const FaqItem = ({ q, a }: { q: string, a: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 py-6">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <span className="text-lg font-medium text-gray-800">{q}</span>
                <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </motion.div>
            </button>
            <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                    <p className="pt-4 text-gray-600 leading-relaxed">{a}</p>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    )
}


export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-800 antialiased">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <nav className="flex items-center justify-between h-20">
              <Link href="/" className="flex items-center space-x-3">
                  <ShieldCheck className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">Swipe Safe</span>
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
                <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">How It Works</Link>
                <Link href="#faq" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">FAQ</Link>
              </div>
              <div className="flex items-center">
                <Link
                  href="/dashboard"
                  className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-transform active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative isolate pt-20 pb-24 sm:pt-28 sm:pb-32">
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80d1ff] to-[#5c67fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
            </div>
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                            Swipe with Confidence.
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Our AI analyzes your dating conversations for red flags and positive signs, giving you the clarity you need to connect safely.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href="/dashboard"
                                className="rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-transform active:scale-95"
                            >
                                Analyze a Chat for Free <ArrowRight className="inline ml-2 h-5 w-5"/>
                            </Link>
                        </div>
                    </motion.div>
                </div>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
                    <AppLogos />
                </motion.div>
            </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="bg-gray-50 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                     <h2 className="text-base font-semibold leading-7 text-blue-600">Simple & Secure</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Get Clarity in 3 Easy Steps</p>
                </div>
                <div className="mx-auto mt-20 max-w-lg space-y-12 lg:max-w-none">
                    {howItWorksSteps.map((step, index) => (
                        <motion.div key={step.title} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.2 }} className="relative flex items-start space-x-6">
                           <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-4 rounded-full">
                               <step.icon className="h-8 w-8" aria-hidden="true" />
                           </div>
                           <div>
                               <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                               <p className="mt-2 text-gray-600">{step.description}</p>
                           </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-blue-600">Your AI Safety Net</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Deeper Insights for Smarter Dating</p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
                        {features.map((feature) => (
                           <motion.div key={feature.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col">
                               <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                                   <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                       <feature.icon className="h-6 w-6" aria-hidden="true" />
                                   </div>
                                   {feature.name}
                               </dt>
                               <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                   <p className="flex-auto">{feature.description}</p>
                               </dd>
                           </motion.div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-gray-50 py-24 sm:py-32">
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-blue-600">Answers</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Frequently Asked Questions</p>
                </div>
                <div className="mt-12">
                    {faqs.map((faq) => <FaqItem key={faq.question} q={faq.question} a={faq.answer} />)}
                </div>
            </div>
        </section>
        
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 lg:px-8">
            <nav className="mb-8 flex justify-center space-x-6" aria-label="Footer">
                <Link href="#features" className="text-sm leading-6 text-gray-600 hover:text-gray-900">Features</Link>
                <Link href="#how-it-works" className="text-sm leading-6 text-gray-600 hover:text-gray-900">How It Works</Link>
                <Link href="#faq" className="text-sm leading-6 text-gray-600 hover:text-gray-900">FAQ</Link>
            </nav>
            <p className="text-center text-xs leading-5 text-gray-500">
                &copy; {new Date().getFullYear()} Swipe Safe. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
}