import { useState } from 'react';
import './App.css';
import Search from './components/Search';  // Import the Search component

function App() {
  // State to manage the search query
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);  // To manage search state

  // Handling input change for search query
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchClick = () => {
    if (!searchQuery) return; // Prevent search if query is empty
    setIsSearching(true);
  };

  // Function to reset the search state after completion
  const handleSearchComplete = () => {
    setIsSearching(false);  // Reset searching state when search is done
  };

  return (
    <div className="app">
      <h1>Quest Search</h1>
      
      {/* Search Bar */}
      <div className="search-container">
        <input 
          type="text" 
          value={searchQuery} 
          onChange={handleSearchChange} 
          placeholder="Search for questions..." 
        />
        <button 
          onClick={handleSearchClick} 
          disabled={isSearching || !searchQuery.trim()}  // Disable button if search is in progress or query is empty
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Pass the search query and search state to the Search component */}
      <Search 
        query={searchQuery} 
        isSearching={isSearching} 
        onSearchComplete={handleSearchComplete} 
      />
    </div>
  );
}

export default App;
