import React, { createContext, useContext, useReducer } from 'react';

const ImageContext = createContext();

const initialState = {
  images: [],
  loading: false,
  error: null
};

const imageReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_IMAGES':
      return { ...state, images: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_ANNOTATION':
      return {
        ...state,
        images: state.images.map(img => 
          img.path === action.payload.imagePath 
            ? { ...img, annotations: [...(img.annotations || []), action.payload.annotation] }
            : img
        )
      };
    case 'UPDATE_ANNOTATION':
      return {
        ...state,
        images: state.images.map(img => 
          img.path === action.payload.imagePath 
            ? { 
                ...img, 
                annotations: img.annotations.map(ann => 
                  ann.id === action.payload.annotationId 
                    ? { ...ann, ...action.payload.updates }
                    : ann
                )
              }
            : img
        )
      };
    case 'DELETE_ANNOTATION':
      return {
        ...state,
        images: state.images.map(img => 
          img.path === action.payload.imagePath 
            ? { 
                ...img, 
                annotations: img.annotations.filter(ann => ann.id !== action.payload.annotationId)
              }
            : img
        )
      };
    default:
      return state;
  }
};

export const ImageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(imageReducer, initialState);

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setImages = (images) => {
    dispatch({ type: 'SET_IMAGES', payload: images });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const addAnnotation = (imagePath, annotation) => {
    dispatch({ 
      type: 'ADD_ANNOTATION', 
      payload: { imagePath, annotation: { ...annotation, id: Date.now() } }
    });
  };

  const updateAnnotation = (imagePath, annotationId, updates) => {
    dispatch({ 
      type: 'UPDATE_ANNOTATION', 
      payload: { imagePath, annotationId, updates }
    });
  };

  const deleteAnnotation = (imagePath, annotationId) => {
    dispatch({ 
      type: 'DELETE_ANNOTATION', 
      payload: { imagePath, annotationId }
    });
  };

  const value = {
    ...state,
    setLoading,
    setImages,
    setError,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation
  };

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImages = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImages must be used within an ImageProvider');
  }
  return context;
};
