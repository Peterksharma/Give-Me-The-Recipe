export default function Footer() {
  return (
    <footer className="h-20 bg-blue-950 border-t border-blue-800 flex items-center justify-center">
      <p className="text-white text-sm font-sans">
        Created by{' '}
        <a
          href="mailto:peterksharma@gmail.com"
          className="text-blue-300 hover:text-blue-200 transition-colors"
        >
          Peter Sharma
        </a>
      </p>
    </footer>
  );
}
