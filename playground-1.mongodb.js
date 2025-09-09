/* global use, db */
// MongoDB Playground - SCRIPT DE DIAGNÓSTICO AVANZADO

// Este script NO BORRA NADA. Su único propósito es analizar los datos
// de tu colección de torneos para encontrar inconsistencias que puedan
// estar causando el error 500 en el servidor.

// 1. SELECCIONA LA BASE DE DATOS CORRECTA
use('padel-chilecito-app');

// 2. EJECUTA EL ANÁLISIS
// El siguiente código buscará todos los torneos y mostrará información
// importante sobre cada uno, especialmente el tipo de dato de la fecha.
console.log("--- INICIANDO ANÁLISIS DE TORNEOS ---");

// Usamos un cursor para manejar los documentos uno por uno.
const cursor = db.getCollection('tournaments').find({});
let count = 0;

if (!cursor.hasNext()) {
    console.log("No se encontraron torneos en la base de datos.");
} else {
    cursor.forEach(tourney => {
        count++;
        console.log("----------------------------------------");
        console.log(`ID del Torneo: ${tourney._id}`);
        console.log(`Estado (status): ${tourney.status}`);
        
        // Verificamos el campo startDate
        const startDate = tourney.startDate;
        
        console.log(`Fecha de Inicio (startDate): ${startDate}`);
        
        // Esta es la comprobación más importante. El servidor falla si la fecha no es una fecha real.
        if (startDate instanceof Date) {
            console.log("  -> TIPO DE DATO de startDate: Correcto (Date Object)");
        } else {
            // Si el tipo no es 'Date', lo marcamos como un error.
            const startDateType = typeof startDate;
            console.log(`  -> ¡¡¡ALERTA!!! TIPO DE DATO de startDate: INCORRECTO (${startDateType})`);
        }
    });
    console.log("----------------------------------------");
    console.log(`Análisis completado. Se revisaron ${count} torneos.`);
}

console.log("\nPor favor, copia todo el texto que apareció en la sección 'Output' (la salida de la consola) y pégalo en nuestra conversación para que pueda analizarlo.");
