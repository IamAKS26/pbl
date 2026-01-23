import Navbar from './Navbar';
import Footer from './Footer';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="min-h-screen font-sans bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <header className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-emerald-50 text-emerald-600 text-sm font-semibold mb-6 border border-emerald-100">
                        🚀 Revolutionizing Education
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
                        Master Skills through <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">Project-Based Learning</span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        GyanSetu's PBL platform bridges the gap between theory and practice. collaborate with peers, solve real problems, and build a portfolio that matters.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register" className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-full text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 transform hover:-translate-y-1">
                            Start Learning Now
                            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                        <Link to="/about" className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-full text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                            Learn More
                        </Link>
                    </div>
                </div>

                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-100 opacity-50 blur-3xl"></div>
                    <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-blue-100 opacity-50 blur-3xl"></div>
                </div>
            </header>

            {/* Features Preview */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose GyanSetu PBL?</h2>
                        <p className="text-gray-500">Everything you need to manage projects and assess skill mastery.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: 'Collaboration', icon: '👥', desc: 'Work in teams with seamless communication.' },
                            { title: 'Code Editor', icon: '💻', desc: 'Built-in VS Code-style editor for instant coding.' },
                            { title: 'Gamification', icon: '🏆', desc: 'Earn XP and badges as you complete milestones.' },
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-500">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
