"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./directions-map.module.css";

const DESTINATION = { x: 400.6, y: 565.1 };

const ORIGINS = [
  {
    id: "hospital-clinic",
    name: "Metro Hospital Clínic",
    detail: "L5 · salida Villarroel",
    distance: "406 m",
    duration: "5 min",
    start: { x: 476.3, y: 646.4 },
    coordinates: "41.3889558,2.1517725",
    path: "M 476.3 646.4 L 473.6 643.6 L 460.6 630.3 L 452.5 622.3 L 447 616.9 L 442.1 612 L 441.3 611.2 L 425.3 595.5 L 424.7 594.8 L 421.1 591.3 L 420.1 590.3 L 416.1 586.2 L 415 585.1 L 399.4 569.3 L 400.3 568.4 L 400.6 568.1 L 401 567.7 L 400.7 567 L 400.6 565.1",
  },
  {
    id: "universitat",
    name: "Metro Universitat",
    detail: "L1 · L2",
    distance: "1,77 km",
    duration: "22 min",
    start: { x: 759.8, y: 751.8 },
    coordinates: "41.385585,2.163946",
    path: "M 759.8 751.8 L 759.1 752.1 L 757.8 753.3 L 756.8 754.2 L 756.1 754.8 L 755.7 754.4 L 753.2 756.7 L 753.9 757.3 L 751.9 759.6 L 749.8 757.4 L 748.4 756 L 747.5 757 L 745.8 758.7 L 744 756.8 L 743.5 756.4 L 742.4 755.4 L 741.8 754.8 L 739.9 752.8 L 737 750 L 735 748 L 726.8 739.7 L 720.5 733.3 L 715.9 728.7 L 710.7 723.4 L 706 718.6 L 693.3 705.7 L 689.8 702.1 L 685 697.6 L 681 693.6 L 668.5 680.7 L 659.6 671.5 L 652.1 663.9 L 643 654.7 L 633.8 645.5 L 627.1 639.3 L 613.6 625.3 L 606.6 618.1 L 599.8 611.2 L 598.6 612 L 588.2 602 L 583.1 597.3 L 581.5 596 L 577 596.9 L 574.7 595.7 L 565.7 604.5 L 559 611.2 L 557.5 610.4 L 549.6 610.8 L 547.6 611.4 L 543.1 606.9 L 532.5 596.2 L 522.1 585.6 L 520.8 586.6 L 504.7 570.9 L 497.8 569.8 L 496.5 570.8 L 482.9 582.9 L 479.5 585.8 L 478.2 584.3 L 470.8 584.9 L 469.8 585.8 L 459.9 575.9 L 453.3 569.2 L 450.9 568.7 L 445.1 568.6 L 443 569.3 L 436.2 576.1 L 426.6 585.9 L 424.7 584.3 L 418 584.5 L 405.6 572.6 L 401 567.7 L 400.6 565.1",
  },
  {
    id: "diagonal",
    name: "Metro Diagonal",
    detail: "L3 · L5",
    distance: "1,38 km",
    duration: "16 min",
    start: { x: 676.3, y: 433.3 },
    coordinates: "41.395805,2.160340",
    path: "M 676.3 433.3 L 677.2 434.3 L 673.6 437.6 L 671.6 439.3 L 673 440.9 L 669.3 444.5 L 667 446.8 L 662.6 451.1 L 655.8 458.3 L 647 466.8 L 644.9 468.8 L 646.4 470.8 L 642.4 475 L 639 478.5 L 634.4 483.1 L 617.9 499.6 L 611.2 506.2 L 602.9 514.7 L 600.2 517.3 L 584.6 533 L 574.3 543 L 557.5 559.3 L 550.2 558.3 L 548.5 559.2 L 534.9 545.3 L 532.1 542.4 L 530.8 543.5 L 524 542.9 L 521.5 542.7 L 517 547 L 505.6 558.3 L 504 558 L 497.9 558.1 L 494.9 558.3 L 488.4 551.9 L 479 542.7 L 471.1 543.4 L 469.5 543.2 L 460.7 551.7 L 451.8 560.6 L 442.4 569.9 L 436.2 576.1 L 426.6 585.9 L 424.7 584.3 L 418 584.5 L 405.6 572.6 L 401 567.7 L 400.6 565.1",
  },
] as const;

const MAP_TILES = Array.from({ length: 6 }, (_, row) =>
  Array.from({ length: 6 }, (_, column) => ({
    x: column * 256,
    y: row * 256,
    href: `https://tile.openstreetmap.org/16/${33157 + column}/${24473 + row}.png`,
  })),
).flat();

export function DirectionsMap() {
  const [originId, setOriginId] = useState<(typeof ORIGINS)[number]["id"]>("hospital-clinic");
  const origin = ORIGINS.find((item) => item.id === originId) ?? ORIGINS[0];
  const sceneRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const previousHtmlOverflowX = document.documentElement.style.overflowX;
    const previousBodyOverflowX = document.body.style.overflowX;
    // El `overflow-x: hidden` global convierte el body en contenedor de scroll
    // y desactiva `position: sticky` en algunos navegadores. `clip` evita el
    // desbordamiento sin romper la escena fijada.
    document.documentElement.style.overflowX = "clip";
    document.body.style.overflowX = "clip";

    const scene = sceneRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!scene || !svg || !path || !dot) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const render = () => {
      frame = 0;
      const rect = scene.getBoundingClientRect();
      const distance = Math.max(1, scene.offsetHeight - window.innerHeight);
      const scrollProgress = Math.min(1, Math.max(0, -rect.top / distance));
      // La animación termina antes que la escena para mantener el mapa fijado
      // unos instantes y mostrar completas ambas etiquetas al llegar.
      const progress = reduceMotion.matches ? 1 : Math.min(1, scrollProgress / 0.82);
      const point = path.getPointAtLength(path.getTotalLength() * progress);

      path.style.strokeDashoffset = String(1 - progress);
      dot.setAttribute("cx", String(point.x));
      dot.setAttribute("cy", String(point.y));

      const arrivalProgress = Math.min(1, Math.max(0, (progress - 0.65) / 0.35));
      const easedArrival = arrivalProgress * arrivalProgress * (3 - 2 * arrivalProgress);
      const midpointProgress = Math.min(1, progress / 0.5);
      const easedMidpoint = midpointProgress * midpointProgress * (3 - 2 * midpointProgress);
      // Conserva una vista amplia durante la caminata y acerca la cámara con
      // fuerza hasta la mitad; el último tramo remata la llegada al taller.
      const width = 1190 - easedMidpoint * 570 - easedArrival * 60;
      const height = width * 0.75;
      const worldX = point.x * 2 - 256;
      const worldY = point.y * 2 - 256;
      const x = Math.min(1536 - width, Math.max(0, worldX - width / 2));
      const y = Math.min(
        1536 - height,
        Math.max(0, worldY - height / 2 + easedArrival * 54),
      );
      svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
      const unitsPerPixel = width / Math.max(320, svg.clientWidth);
      svg.querySelectorAll<SVGCircleElement>("[data-map-marker]").forEach((marker) => {
        const screenRadius = Number(marker.dataset.mapMarker || 7);
        marker.setAttribute("r", String(Math.max(1.2, (screenRadius * unitsPerPixel) / 2)));
      });
      scene.style.setProperty("--route-progress", progress.toFixed(3));
    };

    const requestRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    render();
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);
    reduceMotion.addEventListener("change", requestRender);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
      reduceMotion.removeEventListener("change", requestRender);
      document.documentElement.style.overflowX = previousHtmlOverflowX;
      document.body.style.overflowX = previousBodyOverflowX;
    };
  }, [origin.id]);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.coordinates}&destination=41.3915842,2.1486255&travelmode=walking`;

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <Link className={styles.backLink} href="/">
          <span aria-hidden="true">←</span> Inicio
        </Link>
        <h1>El camino también forma parte de la experiencia.</h1>
        <p className={styles.lead}>
          Elige tu punto de partida y descubre el recorrido a pie hasta nuestro
          taller. Desliza para seguir la ruta.
        </p>
        <span className={styles.scrollCue} aria-hidden="true">
          <span />
          escoge destino
        </span>
        <label className={styles.originPicker}>
          <span>Punto de partida</span>
          <select value={originId} onChange={(event) => setOriginId(event.target.value as typeof originId)}>
            {ORIGINS.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <small>{origin.detail} · {origin.distance} · {origin.duration} a pie</small>
        </label>
      </header>

      <section ref={sceneRef} className={styles.scene} aria-label="Ruta animada desde Metro Hospital Clínic hasta Casa Rosier">
        <div className={styles.stickyMap}>
          <div className={styles.mapHeading}>
            <p>Ruta a pie</p>
            <strong>{origin.name} → Casa Rosier</strong>
          </div>
          <svg
            ref={svgRef}
            className={styles.map}
            viewBox="101 591 1190 892.5"
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-labelledby="map-title map-description"
          >
            <title id="map-title">Cómo llegar a Casa Rosier</title>
            <desc id="map-description">Ruta ilustrada a pie desde Metro Hospital Clínic hasta Carrer de Villarroel 204.</desc>
            <rect width="1536" height="1536" fill="#e9e4d9" />
            <g className={styles.tileLayer}>
              {MAP_TILES.map((tile) => (
                <image
                  key={tile.href}
                  href={tile.href}
                  x={tile.x}
                  y={tile.y}
                  width="256"
                  height="256"
                  preserveAspectRatio="none"
                />
              ))}
            </g>

            <g transform="translate(-256 -256) scale(2)">
            <path
              ref={pathRef}
              className={styles.route}
              pathLength="1"
              d={origin.path}
            />
            <circle data-map-marker="14" className={styles.startHalo} cx={origin.start.x} cy={origin.start.y} r="12" />
            <circle data-map-marker="6" className={styles.startDot} cx={origin.start.x} cy={origin.start.y} r="6" />
            <circle data-map-marker="14" className={styles.endHalo} cx={DESTINATION.x} cy={DESTINATION.y} r="12" />
            <circle data-map-marker="6" className={styles.endDot} cx={DESTINATION.x} cy={DESTINATION.y} r="6" />
            <circle data-map-marker="8" ref={dotRef} className={styles.traveller} cx={origin.start.x} cy={origin.start.y} r="7" />

            <g className={styles.metroLabel} transform={`translate(${origin.start.x - 38} ${origin.start.y + 10})`}>
              <rect x="0" y="0" width="105" height="29" rx="14.5" />
              <circle cx="15" cy="14.5" r="8" />
              <text x="15" y="17.3" textAnchor="middle">M</text>
              <text x="28" y="13">{origin.name.replace("Metro ", "")}</text>
              <text className={styles.metroExit} x="28" y="23">{origin.detail}</text>
            </g>
            <g className={styles.destinationLabel} transform="translate(425 530)">
              <rect x="0" y="0" width="86.4" height="28.8" rx="3.6" />
              <text x="7.2" y="12.6">CASA ROSIER</text>
              <text className={styles.address} x="7.2" y="22.5">Villarroel, 204</text>
            </g>
            </g>
          </svg>
          <p className={styles.attribution}>
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
          </p>
          <div className={styles.progress} aria-hidden="true"><span /></div>
        </div>
      </section>

      <section className={styles.arrival}>
        <p className={styles.eyebrow}>Has llegado</p>
        <img
          className={styles.arrivalLogo}
          src="/img/logo-header.png"
          alt="Casa Rosier"
        />
        <address>Carrer de Villarroel, 204<br />L&apos;Eixample, 08036 Barcelona</address>
        <p>{origin.duration} a pie desde {origin.name}.</p>
        <a className={styles.mapsButton} href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
          Abrir indicaciones en Google Maps
        </a>
        <Link className={styles.homeLink} href="/">Volver al inicio</Link>
      </section>
    </main>
  );
}
