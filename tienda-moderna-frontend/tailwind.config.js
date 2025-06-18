// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Habilita el modo oscuro basado en la clase 'dark' en el HTML
  content: [
    // Rutas a todos tus archivos que contienen clases de Tailwind
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      // Define aquí tus extensiones de tema, como fuentes personalizadas
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // Asegúrate de que 'Inter' esté disponible si la usas
      },
    },
  },
  plugins: [], // Agrega aquí cualquier plugin de Tailwind que uses
};
