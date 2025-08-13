import mongoose from 'mongoose';

const landingCustomisationSchema = new mongoose.Schema({
  // Background options
  backgroundType: {
    type: String,
    enum: ['image', 'color', 'gradient'],
    default: 'image'
  },
  backgroundImage: {
    type: String,
    default: '/images/changihome.jpg'
  },
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  gradientColors: {
    type: [String],
    default: ['#c4eb22', '#17c4c4']
  },
  gradientDirection: {
    type: String,
    default: 'to right'
  },
  
  // Welcome message
  welcomeMessage: {
    type: String,
    default: 'Welcome To GoChangi!'
  },
  description: {
    type: String,
    default: 'Discover Changi, One Clue at a Time!'
  },
  
  // Text styling
  titleColor: {
    type: String,
    default: '#000000'
  },
  descriptionColor: {
    type: String,
    default: '#000000'
  },
  
  buttonGradient: {
    type: String,
    default: 'linear-gradient(to right, #c4ec1b, #00c4cc)'
  },
  buttonTextColor: {
    type: String,
    default: '#000000'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  showLogo: {
    type: Boolean,
    default: true
  }
});

const LandingCustomisation = mongoose.model('LandingCustomisation', landingCustomisationSchema);
export default LandingCustomisation;