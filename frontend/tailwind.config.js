/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'chat-dark': '#0A1512',
                'chat-dark-secondary': '#0E1916',
                'chat-border': '#1E2B23',
                'chat-green': '#52C841',
            },
        },
    },
    plugins: [],
};
  