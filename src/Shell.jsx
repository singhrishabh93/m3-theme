export default function Shell({ name, tag, description, repo, hero, children }) {
  return (
    <div className="shell">
      <header className="hero">
        {tag ? <span className="chip">{tag}</span> : null}
        <h1>{name}</h1>
        <p className="hero-sub">{description}</p>
        {hero}
      </header>
      <main>{children}</main>
      <footer className="footer">
        built by{" "}
        <a href="https://www.rishabhsingh.tech" target="_blank" rel="noreferrer">
          rishabh singh
        </a>
        {" · "}
        <a href={`https://github.com/singhrishabh93/${repo}`} target="_blank" rel="noreferrer">
          source
        </a>
        {" · "}
        <a href="https://www.rishabhsingh.tech/mini-apps">more mini apps</a>
      </footer>
    </div>
  );
}
