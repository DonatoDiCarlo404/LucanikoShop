import mongoose from 'mongoose';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const categoriesData = [
  {
    name: 'Abbigliamento e Accessori',
    subcategories: [
      'Abbigliamento uomo',
      'Abbigliamento donna',
      'Abbigliamento bambino',
      'Intimo e underwear',
      'Abbigliamento sportivo',
      'Borse e zaini',
      'Cinture e portafogli',
      'Cappelli e sciarpe',
      'Accessori moda'
    ]
  },
  {
    name: 'Benessere e Salute',
    subcategories: [
      'Integratori alimentari',
      'Prodotti naturali ed erboristici',
      'Cosmetici naturali',
      'Cura del corpo',
      'Cura dei capelli',
      'Igiene personale',
      'Dispositivi per il benessere',
      'Relax e aromaterapia'
    ]
  },
  {
    name: 'Calzature',
    subcategories: [
      'Scarpe uomo',
      'Scarpe donna',
      'Scarpe bambino',
      'Sneakers',
      'Scarpe eleganti',
      'Scarpe sportive',
      'Sandali e ciabatte',
      'Stivali e anfibi'
    ]
  },
  {
    name: 'Casa, Arredi e Ufficio',
    subcategories: [
      'Arredamento interno',
      'Arredamento esterno',
      'Illuminazione',
      'Decorazioni e complementi',
      'Tessili per la casa',
      'Cucina e tavola',
      'Pulizia e organizzazione',
      'Arredo ufficio',
      'Cancelleria'
    ]
  },
  {
    name: 'Cibi e Bevande',
    subcategories: [
      'Salumi e formaggi',
      'Peperoni cruschi e prodotti tipici',
      'Pasta, cereali e legumi',
      'Conserve e sottoli',
      'Olio e condimenti',
      'Dolci, biscotti e prodotti da forno',
      'Vini, spumanti e birre',
      'Liquori e distillati',
      'Bevande analcoliche',
      'Box'
    ]
  },
  {
    name: 'Elettronica e Informatica',
    subcategories: [
      'Computer e tablet',
      'Smartphone e accessori',
      'Audio e cuffie',
      'TV e video',
      'Fotografia e video',
      'Gaming e console',
      'Accessori informatici',
      'Componenti elettronici'
    ]
  },
  {
    name: 'Industria, Ferramenta e Artigianato',
    subcategories: [
      'Utensili manuali',
      'Utensili elettrici',
      'Ferramenta',
      'Attrezzature professionali',
      'Sicurezza sul lavoro',
      'Materiali e componenti',
      'Artigianato artistico',
      'Artigianato funzionale'
    ]
  },
  {
    name: 'Libri, Media e Giocattoli',
    subcategories: [
      'Libri',
      'Riviste',
      'Giochi educativi',
      'Giocattoli tradizionali',
      'Giochi creativi',
      'Puzzle e modellismo',
      'Musica e film',
      'Articoli da collezione'
    ]
  },
  {
    name: 'Orologi e Gioielli',
    subcategories: [
      'Orologi uomo',
      'Orologi donna',
      'Gioielli uomo',
      'Gioielli donna',
      'Gioielli artigianali',
      'Bracciali e collane',
      'Anelli',
      'Orecchini'
    ]
  },
  {
    name: 'Ricambi e accessori per auto e moto',
    subcategories: [
      'Ricambi auto',
      'Ricambi moto',
      'Accessori interni',
      'Accessori esterni',
      'Batterie e componenti elettrici',
      'Pneumatici e cerchi',
      'Lubrificanti e additivi',
      'Abbigliamento moto',
      'Caschi e protezioni'
    ]
  },
  {
    name: 'Sport, Hobby e Viaggi',
    subcategories: [
      'Attrezzatura sportiva',
      'Abbigliamento sportivo e fitness',
      'Fitness e palestra',
      'Outdoor e campeggio',
      'Caccia e pesca',
      'Hobby creativi',
      'Modellismo',
      'Viaggi ed esperienze',
      'Accessori da viaggio'
    ]
  }
];

const seedCategories = async () => {
  try {
    // Connessione al database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB');

    // Elimina tutte le categorie esistenti
    await Category.deleteMany({});
    console.log('🗑️  Database categorie pulito');

    let totalCategories = 0;
    let totalSubcategories = 0;

    // Inserisci le nuove categorie
    for (const categoryData of categoriesData) {
      // Crea la macrocategoria
      const parentCategory = await Category.create({
        name: categoryData.name,
        parent: null
      });
      totalCategories++;
      console.log(`✅ Creata macrocategoria: ${parentCategory.name}`);

      // Crea le sottocategorie
      for (const subName of categoryData.subcategories) {
        await Category.create({
          name: subName,
          parent: parentCategory._id
        });
        totalSubcategories++;
        console.log(`   ↳ Creata sottocategoria: ${subName}`);
      }
    }

    console.log('\n🎉 Seed completato con successo!');
    console.log(`📊 Totale macrocategorie: ${totalCategories}`);
    console.log(`📊 Totale sottocategorie: ${totalSubcategories}`);
    console.log(`📊 Totale categorie nel database: ${totalCategories + totalSubcategories}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
    process.exit(1);
  }
};

seedCategories();
