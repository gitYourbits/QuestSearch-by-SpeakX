import './App.css';
import Search from './components/Search';
import { Analytics } from "@vercel/analytics/react"

function App() {
  return (
    <div className="app min-h-screen bg-black">
      <Search />
      <Analytics />
    </div>
  );
}

export default App;
