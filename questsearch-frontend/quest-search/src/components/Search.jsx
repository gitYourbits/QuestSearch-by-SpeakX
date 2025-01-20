import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Search.css';

const Search = ({ query, isSearching, onSearchComplete }) => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Number of results per page

  // Function to perform the search
  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query.');
      return;
    }

    try {
      // Request search from the backend with pagination params
      const response = await axios.post('http://localhost:3000/api/search', {
        query,
        page: currentPage,
        pageSize,
      });

      console.log('Search results:', response.data.questions);
      setResults(response.data.questions);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching search results. Please try again later.');
    } finally {
      onSearchComplete(); // Notify parent that search is complete
    }
  };

  // Trigger search when query, isSearching, or currentPage changes
  useEffect(() => {
    if (query.trim() && isSearching) {
      handleSearch();  // Trigger the search whenever query, isSearching, or currentPage changes
    }
  }, [query, isSearching, currentPage]);  // Add currentPage as a dependency

  // Pagination handlers
  const handleNextPage = () => {
    setCurrentPage((prevPage) => {
      const nextPage = prevPage + 1;
      handleSearch(); // Trigger search immediately after page update
      return nextPage;
    });
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => {
      const prev = prevPage > 1 ? prevPage - 1 : 1;
      handleSearch(); // Trigger search immediately after page update
      return prev;
    });
  };

  return (
    <div>
      <ul>
        {isSearching ? (
          <p>Searching...</p>
        ) : (
          <>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {results.length > 0 ? (
              results.map((item, index) => (
                <li key={index}>
                  <strong>{item.title}</strong>
                  {item.type === 'CONTENT_ONLY' && <p>{item.content}</p>}
                  {item.type === 'ANAGRAM' && item.blocks && (
                    <ul>
                      {item.blocks.map((block, i) => (
                        <li key={i}>
                          {block.text} {block.isAnswer && "(Answer)"}
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.type === 'MCQ' && item.options && (
                    <ul>
                      {item.options.map((option, i) => (
                        <li key={i}>
                          {option.text} {option.isCorrectAnswer && "(Correct Answer)"}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))
            ) : (
              <p>No results found</p>
            )}
          </>
        )}
      </ul>

      {/* Pagination controls */}
      <div>
        <button onClick={handlePrevPage} disabled={currentPage <= 1}>
          Previous
        </button>
        <button onClick={handleNextPage}>Next</button>
      </div>
    </div>
  );
};

export default Search;
