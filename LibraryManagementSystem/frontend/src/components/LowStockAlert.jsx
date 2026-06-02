import React, {
    useEffect,
    useState
  } from 'react';
  
  import api from '../services/api';
  
  import './LowStockAlert.css';
  
  export default function LowStockAlert() {
  
    const [books,
      setBooks] = useState([]);
  
    useEffect(() => {
  
      fetchLowStockBooks();
  
    }, []);
  
    const fetchLowStockBooks =
      async () => {
  
        try {
  
          const res =
            await api.get(
              '/books/low-stock'
            );
  
          setBooks(
            res.data.books || []
          );
  
        } catch (err) {
  
          console.error(err);
        }
      };
  
    if (books.length === 0) {
  
      return (
  
        <div className="inventory-ok">
  
          ✅ Inventory status healthy.
          No low stock books.
  
        </div>
      );
    }
  
    return (
  
      <div className="low-stock-card">
  
        <div className="low-stock-header">
  
          ⚠ Low Stock Alerts
  
        </div>
  
        <div className="low-stock-list">
  
          {
            books.map((book) => (
  
              <div
                key={book.id}
                className="low-stock-item"
              >
  
                <div>
  
                  <h4>
                    {book.title}
                  </h4>
  
                  <p>
                    Available:
                    {book.available}
                  </p>
  
                </div>
  
                <span
                  className={
                    book.available <= 1
                      ? 'danger'
                      : 'warning'
                  }
                >
  
                  {
                    book.available <= 1
                      ? 'Critical'
                      : 'Low Stock'
                  }
  
                </span>
  
              </div>
            ))
          }
  
        </div>
  
      </div>
    );
  }