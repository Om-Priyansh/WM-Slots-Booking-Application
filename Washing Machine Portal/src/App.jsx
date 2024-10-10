import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import {Route, Routes} from "react-router-dom";
import { BrowserRouter as Router} from "react-router-dom";

import Login from "./components/Login"
import MainPage from "./components/MainPage"

function App() {
  const [count, setCount] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <>
    <Router>
      <Routes>
      <Route path='/' element = {<Login email = {email} password = {password}/>} />
      <Route path='/loggedin' element = {<MainPage email = {email} password = {password} />} />
        
      </Routes>
    </Router>
      
      {/* <Login /> */}
      
      {/* <hi className = "text-7xl text-center text-blue">hi</hi> */}
    </>
  )
}

export default App
