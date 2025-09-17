import React from 'react';

function Contact() {
    return (
        <div className="max-w-4xl mx-auto text-gray-300">
            <h1 className="text-4xl font-extrabold text-white text-center mb-8">Contacto</h1>

            <div className="bg-gray-800 p-8 rounded-lg shadow-xl space-y-8">
                <section>
                    <h2 className="text-2xl font-bold text-green-400 mb-4">Información de Contacto</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <i className="fas fa-envelope text-green-400 text-xl w-6 text-center"></i>
                            <a href="mailto:padelchilecito@gmail.com" className="text-lg text-blue-400 hover:text-blue-300 transition-colors">
                                padelchilecito@gmail.com
                            </a>
                        </div>
                        <div className="flex items-start gap-4">
                            <i className="fas fa-phone-alt text-green-400 text-xl w-6 text-center pt-1"></i>
                            <div>
                                <a href="tel:+5493825625422" className="block text-lg text-blue-400 hover:text-blue-300 transition-colors">
                                    3825-625422
                                </a>
                                <a href="tel:+5493825535088" className="block text-lg text-blue-400 hover:text-blue-300 transition-colors">
                                    3825-535088
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <i className="fab fa-instagram text-green-400 text-xl w-6 text-center"></i>
                            <a href="https://www.instagram.com/padelchilecito" target="_blank" rel="noopener noreferrer" className="text-lg text-blue-400 hover:text-blue-300 transition-colors">
                                @PadelChilecito
                            </a>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}

export default Contact;
