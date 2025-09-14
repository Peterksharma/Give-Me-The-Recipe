import { Laptop, Mail, Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
      <footer className="recipe-footer h-20 bg-blue-900">
      {/* Light blue line at the top */}
      <div className="recipe-footer-line"></div>
      
      {/* Footer content */}
      <div className="flex flex-col justify-center items-center h-full gap-2">
        <p className="text-white text-sm font-sans">
          Created by <a href="https://petersharma.dev" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200">Peter Sharma</a>
        </p>
        <div className="flex items-center gap-2 text-white">
          <a href="https://github.com/Peterksharma" target="_blank" rel="noopener noreferrer">
            <Github className="w-4 h-4 hover:text-black hover:scale-105 transition-all duration-200 cursor-pointer" />
          </a>
          <a href="https://www.linkedin.com/in/peterksharma/" target="_blank" rel="noopener noreferrer">
            <Linkedin className="w-4 h-4 hover:text-blue-300 hover:scale-105 transition-all duration-200 cursor-pointer" />
          </a>
          <a href="https://petersharma.dev" target="_blank" rel="noopener noreferrer">
            <Laptop className="w-4 h-4 hover:text-yellow-300 hover:scale-105 transition-all duration-200 cursor-pointer" />
          </a>
          <a href="mailto:peterksharma@gmail.com">
            <Mail className="w-4 h-4 hover:text-orange-500 hover:scale-105 transition-all duration-200 cursor-pointer" />
          </a>
        </div>
      </div>
    </footer>
  )
}
