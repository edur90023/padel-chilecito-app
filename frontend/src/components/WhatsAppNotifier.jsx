import React, { useState, useEffect } from 'react';

const WhatsAppNotifier = ({ match, tournamentName, onComplete }) => {
    const [playersToNotify, setPlayersToNotify] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [notifiedCount, setNotifiedCount] = useState(0);

    useEffect(() => {
        if (match) {
            const players = [
                ...(match.teamA?.players || []),
                ...(match.teamB?.players || [])
            ];
            setPlayersToNotify(players);
        }
    }, [match]);

    /**
     * Valida y formatea un número de teléfono de Argentina (formato "3825 625422").
     * Devuelve el número en formato internacional (ej: 5493825625422) o null si no es válido.
     */
    const formatArgentinianPhoneNumber = (phone) => {
        if (!phone) return null;
        
        // 1. Limpiar cualquier caracter que no sea un dígito (espacios, guiones, etc.)
        const cleaned = ('' + phone).replace(/\D/g, '');

        // 2. Validar que el número limpio tenga 10 dígitos (ej: 3825625422)
        if (cleaned.length === 10) {
            // 3. Añadir el prefijo de país y el 9 para celulares de Argentina
            return '549' + cleaned;
        }

        // 4. Si no cumple con el formato, se considera inválido
        return null;
    };

    const notifyNextPlayer = () => {
        if (currentIndex >= playersToNotify.length) {
            alert('Todos los jugadores han sido procesados.');
            onComplete();
            return;
        }

        const player = playersToNotify[currentIndex];
        const formattedPhone = formatArgentinianPhoneNumber(player.phoneNumber);

        if (!formattedPhone) {
            // Si el número no es válido, alertar al admin y pasar al siguiente
            alert(`El número de teléfono de "${player.playerName}" (${player.phoneNumber || 'ninguno'}) no parece ser un número válido de Argentina. Se saltará a este jugador.`);
            setCurrentIndex(currentIndex + 1); // Moverse al siguiente jugador
            return;
        }

        const date = match.matchTime ? new Date(match.matchTime).toLocaleDateString('es-AR') : 'Fecha a confirmar';
        const time = match.matchTime ? new Date(match.matchTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : 'Hora a confirmar';

        const message = `¡Hola ${player.playerName}! Te informamos los datos de tu próximo partido del torneo "${tournamentName}":
- Partido: ${match.teamA.teamName} vs ${match.teamB.teamName}
- Lugar: ${match.matchPlace || 'A confirmar'}
- Fecha: ${date}
- Hora: ${time} hs

¡Mucha suerte!`;

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
        
        setNotifiedCount(notifiedCount + 1);
        setCurrentIndex(currentIndex + 1);
    };

    const hasMorePlayers = currentIndex < playersToNotify.length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-xl border border-gray-700 max-w-lg w-full text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Notificar Jugadores por WhatsApp</h3>
                
                {hasMorePlayers ? (
                    <>
                        <p className="text-gray-300 mb-6">
                            Prepara el mensaje para el siguiente jugador. Se abrirá una nueva pestaña de WhatsApp.
                        </p>
                        <div className="bg-gray-900 p-4 rounded-lg mb-6">
                            <p className="text-lg text-gray-400 mb-2">Siguiente jugador:</p>
                            <p className="text-xl font-semibold text-green-400">
                                {playersToNotify[currentIndex].playerName}
                            </p>
                        </div>
                        <button
                            onClick={notifyNextPlayer}
                            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            <i className="fab fa-whatsapp mr-2"></i> Preparar Mensaje
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                         <p className="text-xl text-green-400 mb-6">
                            ¡Proceso finalizado!
                        </p>
                         <p className="text-gray-300 mb-6">
                            Has preparado notificaciones para {notifiedCount} de {playersToNotify.length} jugadores.
                        </p>
                    </div>
                )}

                <button
                    onClick={onComplete}
                    className="w-full mt-4 bg-gray-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default WhatsAppNotifier;