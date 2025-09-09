// frontend/src/pages/Rules.jsx

import React from 'react';

function Rules() {
    return (
        <div className="max-w-4xl mx-auto text-gray-300">
            <h1 className="text-4xl font-extrabold text-white text-center mb-8">Reglamento Deportivo Amateur APA</h1>

            <div className="bg-gray-800 p-8 rounded-lg shadow-xl space-y-6">
                <section>
                    <h2 className="text-2xl font-bold text-green-400 mb-3">Puntuación en Fase de Zonas (Art. 6)</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="font-semibold text-white">Partido Ganado:</span> 2 puntos.</li>
                        <li><span className="font-semibold text-white">Partido Jugado y Perdido:</span> 1 punto.</li>
                        <li><span className="font-semibold text-white">Partido Perdido por W.O.:</span> 0 puntos.</li>
                    </ul>
                </section>
                
                <section>
                    <h2 className="text-2xl font-bold text-green-400 mb-3">Criterios de Desempate en Zonas (Art. 6)</h2>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Diferencia de sets (a favor menos en contra).</li>
                        <li>Diferencia de games (a favor menos en contra).</li>
                        <li>Mayor cantidad de games a favor.</li>
                        <li>Resultado del partido entre las parejas empatadas.</li>
                        <li>Sorteo.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-green-400 mb-3">Puntaje para Ranking (Art. 9)</h2>
                     <p className="mb-2">El siguiente puntaje se asigna para los Campeonatos Argentinos y sirve como referencia:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="font-semibold text-white">Campeón:</span> 1000 puntos.</li>
                        <li><span className="font-semibold text-white">Finalista:</span> 800 puntos.</li>
                        <li><span className="font-semibold text-white">Semifinalista:</span> 600 puntos.</li>
                        <li><span className="font-semibold text-white">Cuartos de Final:</span> 400 puntos.</li>
                        <li><span className="font-semibold text-white">Octavos de Final:</span> 200 puntos.</li>
                    </ul>
                </section>
                
                <section>
                    <h2 className="text-2xl font-bold text-green-400 mb-3">Aspectos Generales del Torneo</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Todos los partidos se juegan al mejor de 3 sets, con tie-break en caso de 6-6.</li>
                        <li>El tiempo de espera máximo es de 10 minutos desde la hora programada.</li>
                        <li>El peloteo previo a cada partido es de 5 minutos.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default Rules;