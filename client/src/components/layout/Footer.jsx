const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                            <span className="font-bold text-gray-900 text-xl tracking-tight">PBL <span className="text-emerald-600">GyanSetu</span></span>
                        </div>
                        <p className="text-gray-500 max-w-sm">
                            Empowering students with Project-Based Learning. Build real-world skills through collaboration, coding, and creativity.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-emerald-600">Features</a></li>
                            <li><a href="#" className="hover:text-emerald-600">For Schools</a></li>
                            <li><a href="#" className="hover:text-emerald-600">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-emerald-600">About Us</a></li>
                            <li><a href="#" className="hover:text-emerald-600">Contact</a></li>
                            <li><a href="#" className="hover:text-emerald-600">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-400">© 2026 GyanSetu PBL. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
