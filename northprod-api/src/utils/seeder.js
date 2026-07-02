/**
 * NORTH PROD — Database Seeder
 * Usage: node src/utils/seeder.js
 * Seeds: default admin user + 4 services + 1 hero media config
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { Service, HeroMedia } = require('../models/Service');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  // ── Admin user ───────────────────────────────────────────
  const existing = await User.findOne({ email: 'admin@northprod.tn' });
  if (!existing) {
    await User.create({
      aka: 'Admin',
      firstName: 'ADMIN',
      lastName: 'ADMIN',
      email: 'admin@northprod.tn',
      password: 'Connect*123',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });
  }
    const existingProd = await User.findOne({ email: 'prod@northprod.tn' });
  if (!existingProd) {
    await User.create({
      aka: 'Prod',
      firstName: 'PROD',
      lastName: 'PROD',
      email: 'prod@northprod.tn',
      password: 'Connect*123',
      role: 'production',
      isEmailVerified: true,
      isActive: true,
    });
    console.log('✅  Admin and Prod user created: admin@northprod.tn - prod@northprod.tn / Connect*123');
  } else {
    console.log('ℹ️   Admin and Prod user already exists');
  }

  // ── Services (pricing) ───────────────────────────────────
  await Service.deleteMany({});
  await Service.insertMany([
    {
      name: 'Séance Record',
      slug: 'record-horaire',
      description: 'Location du studio avec ingénieur du son pour vos enregistrements vocaux et instrumentaux.',
      price: 99,
      unit: 'heure',
      icon: 'fa fa-microphone',
      features: ['Ingénieur du son inclus', 'Console SSL', 'Cabine acoustique', 'Retours casque', 'Fichiers WAV 24bit'],
      isPopular: false,
      order: 1,
    },
    {
      name: 'Forfait / Titre',
      slug: 'record-forfait',
      description: 'Enregistrement complet d\'un titre : voix, adlibs, harmonies — livraison en fichiers stems.',
      price: 120,
      unit: 'titre',
      icon: 'fa fa-music',
      features: ['Enregistrement complet', 'Voix + Adlibs + Harmonies', 'Stems séparés', 'Session illimitée', 'Révision incluse'],
      isPopular: true,
      order: 2,
    },
    {
      name: 'Location Studio',
      slug: 'location-studio',
      description: 'Accès au studio avec tout le matériel sans ingénieur — pour les producteurs autonomes.',
      price: 190,
      unit: 'heure',
      icon: 'fa fa-sliders',
      features: ['Accès complet au studio', 'Sans ingénieur du son', 'Console SSL', 'Monitoring Genelec', 'Pro Tools / Logic Pro'],
      isPopular: false,
      order: 3,
    },
    {
      name: 'Mixage / Mastering',
      slug: 'mix-mastering',
      description: 'Mixage professionnel et mastering de vos titres pour une diffusion sur toutes les plateformes.',
      price: 80,
      unit: 'track',
      icon: 'fa fa-volume-up',
      features: ['Mixage complet', 'Mastering stéréo', 'Livraison WAV + MP3', 'Compatible streaming', '1 révision incluse'],
      isPopular: false,
      order: 4,
    },
  ]);
  console.log('✅  4 services seeded');

  // ── Default hero media (YouTube embed) ───────────────────
  await HeroMedia.deleteMany({});
  await HeroMedia.create({
    isActive: true,
    mediaType: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    title: 'NORTH PROD',
    subtitle: 'Studio de Production Son & Image — Ariana Nkhillet',
    cta: [
      { label: 'Réserver une séance', link: '/auth/register', style: 'primary' },
      { label: 'Créer un compte', link: '/auth/register', style: 'secondary' },
      { label: 'Découvrir nos productions', link: '/portfolio', style: 'outline' },
    ],
    autoplay: true,
    muted: false,
    loop: true,
  });
  console.log('✅  Default hero media seeded');

  await mongoose.disconnect();
  console.log('\n🎵  Seeding complete! You can now start the API.\n');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeder error:', err);
  process.exit(1);
});
