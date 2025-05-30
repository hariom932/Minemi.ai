import React from 'react'
import Index from './assets/components/Index';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

 const App = () => {
  return (
        <>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Index/>}></Route>
          </Routes>
        </BrowserRouter>
          
        </>    
  )
}
export default App; 