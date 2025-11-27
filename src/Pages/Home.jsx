import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <header className="hero">
      <div className="hero-content">
        <h1>Encuentra la pieza perfecta</h1>
        <p>Explora una variedad de piezas de tuning</p>
        <Link to="/articulos" className="shop-button">
          Comprar Ahora!
        </Link>
      </div>
    </header>
  );
}

export default Home;