import React from 'react'
import image from '../../../assets/ph-logo.jpg'
import { Link } from 'react-router-dom'
import Navbar from '../../molecules/Navbar/Navbar'
import Hero from '../Hero/Hero'
import './header.scss'

export default function Header () {

  return(
    <header className="container">
      <div className="header__inner">
        <Link to="/"><img className="logo" src={image} alt='Pairs Head of the River logo' /></Link>
        <Navbar />
      </div>
      <Hero title={'Page title goes here...'}/>
    </header>
  )
}