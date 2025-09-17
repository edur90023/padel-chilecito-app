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

                <section>
                    <h2 className="text-2xl font-bold text-green-400 mb-4">Nuestra Ubicación</h2>
                    <p className="text-lg text-white mb-4">Av. La Mejicana S/N, Chilecito, La Rioja</p>
                    <div className="aspect-w-16 aspect-h-9">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3489.627643634034!2d-67.488394884909!3d-29.17528348227636!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x942777174628096b%3A0x81b5e43c5e8c3a13!2sPadel%20Chilecito!5e0!3m2!1ses-419!2sar!4f64"
                            width="100%"
                            height="450"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="rounded-lg shadow-lg"
                        ></iframe>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Contact;
