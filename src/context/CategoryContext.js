import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CategoryContext = createContext();

const initialState = {
  categories: []
};

const categoryReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { 
        ...state, 
        categories: [...state.categories, { 
          ...action.payload, 
          id: Date.now(),
          color: action.payload.color || '#007bff'
        }]
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat => 
          cat.id === action.payload.id 
            ? { ...cat, ...action.payload.updates }
            : cat
        )
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload)
      };
    default:
      return state;
  }
};

export const CategoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(categoryReducer, initialState);

  // 从localStorage加载类别
  useEffect(() => {
    const savedCategories = localStorage.getItem('imageLabeler_categories');
    if (savedCategories) {
      try {
        const categories = JSON.parse(savedCategories);
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
      } catch (error) {
        console.error('Failed to load categories from localStorage:', error);
      }
    }
  }, []);

  // 保存类别到localStorage
  useEffect(() => {
    localStorage.setItem('imageLabeler_categories', JSON.stringify(state.categories));
  }, [state.categories]);

  const setCategories = (categories) => {
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
  };

  const addCategory = (category) => {
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  };

  const updateCategory = (id, updates) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: { id, updates } });
  };

  const deleteCategory = (id) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  };

  const value = {
    ...state,
    setCategories,
    addCategory,
    updateCategory,
    deleteCategory
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
