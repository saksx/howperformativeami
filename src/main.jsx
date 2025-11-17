import React from "react";
import { createRoot } from "react-dom/client";

const App = () => (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 24 }}>
        <header>
            <h1>Basic HTML Page</h1>
            <p>A minimal page rendered from main.jsx</p>
        </header>

        <main>
            <section>
                <h2>Introduction</h2>
                <p>This demonstrates basic HTML structure inside a React app.</p>
            </section>

            <section>
                <h2>Links</h2>
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </section>
        </main>

        <footer>
            <small>&copy; {new Date().getFullYear()} Your Company</small>
        </footer>
    </div>
);

const mountNode =
    document.getElementById("root") || (() => {
        const el = document.createElement("div");
        el.id = "root";
        document.body.appendChild(el);
        return el;
    })();

createRoot(mountNode).render(<App />);</footer>