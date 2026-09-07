import Image from "next/image";
import Link from "next/link";
import styles from "./estudio.module.css";

export default function EstudioPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Image
          src="/img/logo-header.png"
          alt="Casa Rosier"
          width={86}
          height={52}
          className={styles.logo}
          priority
        />

        <nav className={styles.nav} aria-label="Navegación principal">
          <Link href="/">Home</Link>
          <a href="#">Clases2 <span>⌄</span></a>
          <a href="#">workshops <span>⌄</span></a>
          <a href="#">Experiencias <span>⌄</span></a>
          <a href="#">Gift Cards <span>⌄</span></a>
          <a href="#">Comunidad <span>⌄</span></a>
          <a href="#">Shop</a>
        </nav>
      </header>

      <section className={styles.titleBlock}>
        <h1>EL ESTUDIO</h1>
        <p>CASA ROSIER</p>
      </section>

      <section className={styles.timeline}>
        <div className={styles.centerLine} aria-hidden="true" />

        <div className={`${styles.row} ${styles.introRow}`}>
          <div className={`${styles.half} ${styles.leftHalf}`}>
            <h2 className={styles.introTitle}>
              Quienes hacen
              <br />
              posible el taller
            </h2>
          </div>

          <div className={`${styles.half} ${styles.rightHalf}`}>
            <p className={styles.introText}>
              Compartimos lo que sabemos y
              <br />
              te acompañamos en cada parte
              <br />
              del proceso.
            </p>
          </div>
        </div>

        <div className={styles.row}>
          <article className={`${styles.half} ${styles.leftHalf} ${styles.bioLeft}`}>
            <h3>Rosa Guayanay</h3>
            <p className={styles.role}>
              Ceramista y especialista
              <br />
              en química cerámica
            </p>

            <p>
              Soy Rosa Guayanay, ceramista peruana afincada en Barcelona.
              Aquí encontré no solo una ciudad que me inspira, sino también
              el lugar donde seguir explorando y expandiendo mi universo creativo.
            </p>

            <p>
              Mi relación con la cerámica va más allá del taller: me apasiona
              la química que hay detrás de cada esmalte y la forma en que los
              materiales se transforman con el fuego. Esa mezcla entre arte
              y ciencia es lo que me mueve a seguir experimentando,
              combinando elementos y descubriendo nuevas texturas y colores.
            </p>
          </article>

          <div className={`${styles.half} ${styles.rightHalf} ${styles.imageRight}`}>
            <Image
              src="/img/social-1.jpg"
              alt="Rosa Guayanay en el taller"
              width={620}
              height={760}
              className={styles.profileImage}
            />
          </div>
        </div>

        <div className={`${styles.row} ${styles.lastRow}`}>
          <div className={`${styles.half} ${styles.leftHalf} ${styles.imageLeft}`}>
            <Image
              src="/img/social-2.jpg"
              alt="Especialista de Casa Rosier en el taller"
              width={620}
              height={760}
              className={styles.profileImage}
            />
          </div>

          <article className={`${styles.half} ${styles.rightHalf} ${styles.bioRight}`}>
            <h3>Juan Alvarado</h3>
            <p className={styles.role}>
              Ceramista y especialista en química
              <br />
              cerámica
            </p>

            <p>
              Soy Rosa Guayanay, ceramista peruana afincada en Barcelona.
              Aquí encontré no solo una ciudad que me inspira, sino también
              el lugar donde seguir explorando y expandiendo mi universo creativo.
            </p>

            <p>
              Mi relación con la cerámica va más allá del taller: me apasiona
              la química que hay detrás de cada esmalte y la forma en que los
              materiales se transforman con el fuego. Esa mezcla entre arte
              y ciencia es lo que me mueve a seguir experimentando,
              combinando elementos y descubriendo nuevas texturas y colores.
            </p>

            <p>
              Después de años de estudio, trabajo e investigación, he aprendido que la
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
