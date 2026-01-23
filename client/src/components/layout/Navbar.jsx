import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="bg-white border-b border-gray-100 fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                            <span className="font-bold text-gray-900 text-xl tracking-tight">PBL <span className="text-emerald-600">GyanSetu</span></span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Home</Link>
                        <Link to="/about" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">About</Link>
                        <Link to="/features" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Features</Link>
                        <div className="flex items-center gap-4 ml-4">
                            <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                                Log in
                            </Link>
                            <Link to="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
