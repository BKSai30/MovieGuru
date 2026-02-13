
const Footer = () => {
    return (
        <footer className="bg-surface backdrop-blur-lg border-t-2 border-primary/20 py-4 fixed bottom-0 w-full z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-text/60 dark:text-gray-400 text-sm">
                        © {new Date().getFullYear()} <span className="font-semibold text-text dark:text-white">BKSai</span>. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
