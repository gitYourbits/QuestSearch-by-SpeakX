import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BackgroundBeams } from "@/components/ui/background-beams";
import { TracingBeam } from "@/components/ui/tracing-beam";
import CardHoverEffect from "@/components/ui/card-hover-effect";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const Search = () => {
  const [isServerUp, setIsServerUp] = useState(true);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filter, setFilter] = useState('');

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const checkServerHealth = async () => {
    try {
      await axios.get(`${BASE_URL}/api/health`, { timeout: 3000 });
      setIsServerUp(true);
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        setIsServerUp(false);
      }
    }
  };

  // Running server health check on component mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  const handleSearchChange = (event) => {
    setQuery(event.target.value);
    setResults([]);
    setCurrentPage(1);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query.');
      return;
    }

    setIsSearching(true);
    NProgress.start();
    setError('');

    try {
      const response = await axios.post(`${BASE_URL}/api/search`, {
        query,
        page: currentPage,
        pageSize,
        type: filter,
      });

      const fetchedResults = response.data.questions || [];
      setResults(fetchedResults);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching search results. Please try again later.');
    } finally {
      setIsSearching(false);
      NProgress.done();
      setIsServerUp(true);
    }
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => (prevPage > 1 ? prevPage - 1 : 1));
  };

  useEffect(() => {
    if (query.trim()) {
      handleSearch();
    }
  }, [currentPage]);

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center">
      <BackgroundBeams className="absolute inset-0 z-0 pointer-events-none" />

      <div className="flex flex-col items-center p-6">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-semibold text-center mb-6">
            QuestSearch
          </h1>
          <div className="flex justify-center items-center space-x-4 z-10">
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              className="w-full sm:w-96 w-96 p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Search for questions..."
            />
            <select
              value={filter}
              onChange={handleFilterChange}
              className="p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 sm:w-full"
            >
              <option value="">All</option>
              <option value="CONTENT_ONLY">Content Only</option>
              <option value="ANAGRAM">Anagram</option>
              <option value="MCQ">MCQ</option>
              <option value="READ_ALONG">Read Along</option>
              <option value="CONVERSATION">Conversation</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className={`p-2 rounded-md bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 ${isSearching || !query.trim() ? 'opacity-50 cursor-not-allowed' : ''} sm:w-full`}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="w-full max-w-5xl mt-6">
          {isSearching ? (
            <p className="text-center text-lg">
              Searching...
              {!isServerUp &&
                <>
                  <br />
                  <span className="text-sm text-gray-500">
                    (Waking up the server, Please wait. This may take upto 50 seconds. Why? -
                    <a
                      href="https://render.com/docs/free#spinning-down-on-idle"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    > Learn more
                    </a>
                    )
                  </span>
                </>
              }
            </p>
          ) : (
            <>
              {error && <p className="text-center text-red-500">{error}</p>}
              {results.length > 0 ? (
                <TracingBeam>
                  <CardHoverEffect
                    items={results.map((item) => {
                      switch (item.type) {
                        case 'CONTENT_ONLY':
                          return {
                            title: item.title,
                            description: '(Content-only type question)',
                            link: '#',
                          };
                        case 'ANAGRAM':
                          return {
                            title: item.title,
                            description: `Arrange: ${item.blocks ? item.blocks.filter((block) => block.showInOption).map((block) => block.text).join(' ') : 'No blocks available'}`,
                            link: '#',
                          };
                        case 'MCQ':
                          return {
                            title: item.title,
                            description: (
                              <div>
                                {item.options ? (
                                  <ul className="flex my-2 flex-col space-y-2">
                                    {item.options.map((option, index) => (
                                      <li key={index} className={`p-2 rounded-md ${option.isCorrectAnswer ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                        {option.text}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  'No options available'
                                )}
                              </div>
                            ),
                            link: '#',
                          };
                        case 'READ_ALONG':
                          return {
                            title: item.title,
                            description: '(Read-along type question)',
                            link: '#',
                          };
                        case 'CONVERSATION':
                          return {
                            title: item.title,
                            description: '(Conversation type question)',
                            link: '#',
                          };
                        default:
                          return {
                            title: 'Unknown type',
                            description: '(This question type is not recognized)',
                            link: '#',
                          };
                      }
                    })}
                  />
                </TracingBeam>
              ) : (
                <p className="text-center text-lg">No results.</p>
              )}
            </>
          )}

          <div className="flex flex-col items-center mt-1 mb-9">
            <p className="text-lg mb-2">{results.length > 0 ? `(Pg. ${currentPage})` : ''}</p>
            <div className="flex mt-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`p-3 mx-3 rounded-md bg-gray-700 hover:bg-gray-800 text-white ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''} sm:w-full`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={results.length < pageSize}
                className={`py-3 px-4 mx-3 rounded-md bg-gray-700 hover:bg-gray-800 text-white ${results.length < pageSize ? 'opacity-50 cursor-not-allowed' : ''} sm:w-full`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 mt-auto w-full text-center p-2 bg-gray-900 text-white flex flex-wrap items-center justify-center gap-2">
        <a
          href="https://github.com/gitYourbits"
          target="_blank"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg"
            alt="GitHub"
            className="w-4 h-4 sm:w-6 sm:h-6"
            style={{ filter: 'invert(1)' }}
          />
          Aditya
        </a>
        <span className="hidden sm:inline">&middot;</span>
        <span className="text-center text-sm sm:text-base">&copy; 2025 QuestSearch &middot; All rights reserved.</span>
      </div>
    </div>
  );
};

export default Search;
