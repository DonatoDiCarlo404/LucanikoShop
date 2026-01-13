import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CategoryAttribute from './models/CategoryAttribute.js';
import { Category } from './models/index.js';

dotenv.config();

const seedCategoryAttributes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connessione al database riuscita');

    // Recupera le categorie esistenti
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    console.log(`✅ Trovate ${categories.length} categorie`);

    // Elimina attributi esistenti
    await CategoryAttribute.deleteMany({});
    console.log('🗑️  Attributi precedenti eliminati');

    // Definizione attributi per categoria
    const attributesData = [];

    // ABBIGLIAMENTO
    if (categoryMap['Abbigliamento']) {
      attributesData.push(
        {
          category: categoryMap['Abbigliamento'],
          name: 'Taglia',
          key: 'size',
          type: 'select',
          required: true,
          allowVariants: true,
          order: 1,
          options: [
            { label: 'XS', value: 'xs' },
            { label: 'S', value: 's' },
            { label: 'M', value: 'm' },
            { label: 'L', value: 'l' },
            { label: 'XL', value: 'xl' },
            { label: 'XXL', value: 'xxl' }
          ]
        },
        {
          category: categoryMap['Abbigliamento'],
          name: 'Colore',
          key: 'color',
          type: 'color',
          required: true,
          allowVariants: true,
          order: 2,
          options: [
            { label: 'Nero', value: 'black', color: '#000000' },
            { label: 'Bianco', value: 'white', color: '#FFFFFF' },
            { label: 'Rosso', value: 'red', color: '#FF0000' },
            { label: 'Blu', value: 'blue', color: '#0000FF' },
            { label: 'Verde', value: 'green', color: '#00FF00' },
            { label: 'Giallo', value: 'yellow', color: '#FFFF00' },
            { label: 'Grigio', value: 'gray', color: '#808080' },
            { label: 'Rosa', value: 'pink', color: '#FFC0CB' }
          ]
        },
        {
          category: categoryMap['Abbigliamento'],
          name: 'Materiale',
          key: 'material',
          type: 'select',
          required: false,
          allowVariants: false,
          order: 3,
          options: [
            { label: 'Cotone', value: 'cotton' },
            { label: 'Poliestere', value: 'polyester' },
            { label: 'Lana', value: 'wool' },
            { label: 'Seta', value: 'silk' },
            { label: 'Lino', value: 'linen' },
            { label: 'Misto', value: 'mixed' }
          ]
        },
        {
          category: categoryMap['Abbigliamento'],
          name: 'Genere',
          key: 'gender',
          type: 'select',
          required: true,
          allowVariants: false,
          order: 4,
          options: [
            { label: 'Uomo', value: 'male' },
            { label: 'Donna', value: 'female' },
            { label: 'Unisex', value: 'unisex' }
          ]
        }
      );
    }

    // ABBIGLIAMENTO E ACCESSORI
    if (categoryMap['Abbigliamento e Accessori']) {
      attributesData.push(
        {
          category: categoryMap['Abbigliamento e Accessori'],
          name: 'Tipo',
          key: 'type',
          type: 'select',
          required: true,
          allowVariants: false,
          order: 1,
          options: [
            { label: 'Abbigliamento', value: 'clothing' },
            { label: 'Accessorio', value: 'accessory' }
          ]
        },
        {
          category: categoryMap['Abbigliamento e Accessori'],
          name: 'Taglia',
          key: 'size',
          type: 'select',
          required: false,
          allowVariants: true,
          order: 2,
          options: [
            { label: 'XS', value: 'xs' },
            { label: 'S', value: 's' },
            { label: 'M', value: 'm' },
            { label: 'L', value: 'l' },
            { label: 'XL', value: 'xl' },
            { label: 'XXL', value: 'xxl' },
            { label: 'Taglia Unica', value: 'one_size' }
          ]
        },
        {
          category: categoryMap['Abbigliamento e Accessori'],
          name: 'Colore',
          key: 'color',
          type: 'color',
          required: true,
          allowVariants: true,
          order: 3,
          options: [
            { label: 'Nero', value: 'black', color: '#000000' },
            { label: 'Bianco', value: 'white', color: '#FFFFFF' },
            { label: 'Rosso', value: 'red', color: '#FF0000' },
            { label: 'Blu', value: 'blue', color: '#0000FF' },
            { label: 'Verde', value: 'green', color: '#00FF00' },
            { label: 'Giallo', value: 'yellow', color: '#FFFF00' },
            { label: 'Grigio', value: 'gray', color: '#808080' },
            { label: 'Rosa', value: 'pink', color: '#FFC0CB' },
            { label: 'Marrone', value: 'brown', color: '#8B4513' },
            { label: 'Arancione', value: 'orange', color: '#FFA500' }
          ]
        },
        {
          category: categoryMap['Abbigliamento e Accessori'],
          name: 'Materiale',
          key: 'material',
          type: 'select',
          required: false,
          allowVariants: false,
          order: 4,
          options: [
            { label: 'Cotone', value: 'cotton' },
            { label: 'Poliestere', value: 'polyester' },
            { label: 'Lana', value: 'wool' },
            { label: 'Seta', value: 'silk' },
            { label: 'Lino', value: 'linen' },
            { label: 'Pelle', value: 'leather' },
            { label: 'Sintetico', value: 'synthetic' },
            { label: 'Misto', value: 'mixed' }
          ]
        },
        {
          category: categoryMap['Abbigliamento e Accessori'],
          name: 'Genere',
          key: 'gender',
          type: 'select',
          required: true,
          allowVariants: false,
          order: 5,
          options: [
            { label: 'Uomo', value: 'male' },
            { label: 'Donna', value: 'female' },
            { label: 'Unisex', value: 'unisex' },
            { label: 'Bambino', value: 'kids' }
          ]
        }
      );
    }

    // SCARPE
    if (categoryMap['Scarpe']) {
      attributesData.push(
        {
          category: categoryMap['Scarpe'],
          name: 'Numero',
          key: 'shoe_size',
          type: 'select',
          required: true,
          allowVariants: true,
          order: 1,
          options: Array.from({ length: 20 }, (_, i) => ({
            label: `${35 + i}`,
            value: `${35 + i}`
          }))
        },
        {
          category: categoryMap['Scarpe'],
          name: 'Colore',
          key: 'color',
          type: 'color',
          required: true,
          allowVariants: true,
          order: 2,
          options: [
            { label: 'Nero', value: 'black', color: '#000000' },
            { label: 'Bianco', value: 'white', color: '#FFFFFF' },
            { label: 'Marrone', value: 'brown', color: '#8B4513' },
            { label: 'Blu', value: 'blue', color: '#0000FF' },
            { label: 'Grigio', value: 'gray', color: '#808080' }
          ]
        },
        {
          category: categoryMap['Scarpe'],
          name: 'Tipo',
          key: 'shoe_type',
          type: 'select',
          required: true,
          allowVariants: false,
          order: 3,
          options: [
            { label: 'Sneakers', value: 'sneakers' },
            { label: 'Stivali', value: 'boots' },
            { label: 'Sandali', value: 'sandals' },
            { label: 'Eleganti', value: 'formal' },
            { label: 'Sportive', value: 'sport' }
          ]
        },
        {
          category: categoryMap['Scarpe'],
          name: 'Genere',
          key: 'gender',
          type: 'select',
          required: true,
          allowVariants: false,
          order: 4,
          options: [
            { label: 'Uomo', value: 'male' },
            { label: 'Donna', value: 'female' },
            { label: 'Unisex', value: 'unisex' },
            { label: 'Bambino', value: 'kids' }
          ]
        }
      );
    }

    // ELETTRONICA
    if (categoryMap['Elettronica']) {
      attributesData.push(
        {
          category: categoryMap['Elettronica'],
          name: 'Marca',
          key: 'brand',
          type: 'text',
          required: false,
          allowVariants: false,
          order: 1,
          placeholder: 'Es. Samsung, Apple, Sony, HP, LG, Bosch, Canon, ecc.'
        },
        {
          category: categoryMap['Elettronica'],
          name: 'Modello',
          key: 'model',
          type: 'text',
          required: false,
          allowVariants: false,
          order: 2,
          placeholder: 'Es. modello prodotto (facoltativo)'
        },
        {
          category: categoryMap['Elettronica'],
          name: 'Garanzia (mesi)',
          key: 'warranty',
          type: 'number',
          required: false,
          allowVariants: false,
          order: 3,
          validation: { min: 0, max: 60 },
          placeholder: '12'
        },
        {
          category: categoryMap['Elettronica'],
          name: 'Condizione',
          key: 'condition',
          type: 'select',
          required: false,
          allowVariants: false,
          order: 4,
          options: [
            { label: 'Nuovo', value: 'new' },
            { label: 'Ricondizionato', value: 'refurbished' },
            { label: 'Usato - Come nuovo', value: 'used_like_new' },
            { label: 'Usato - Buone condizioni', value: 'used_good' }
          ]
        },
        {
          category: categoryMap['Elettronica'],
          name: 'Colori',
          key: 'color',
          type: 'color',
          required: false,
          allowVariants: true,
          order: 5,
          options: [
            { label: 'Nero', value: 'black', color: '#000000' },
            { label: 'Bianco', value: 'white', color: '#FFFFFF' },
            { label: 'Grigio', value: 'gray', color: '#808080' },
            { label: 'Blu', value: 'blue', color: '#0000FF' },
            { label: 'Rosso', value: 'red', color: '#FF0000' },
            { label: 'Verde', value: 'green', color: '#00FF00' },
            { label: 'Oro', value: 'gold', color: '#FFD700' },
            { label: 'Argento', value: 'silver', color: '#C0C0C0' }
          ]
        },
        {
          category: categoryMap['Elettronica'],
          name: 'Memoria',
          key: 'memory',
          type: 'select',
          required: false,
          allowVariants: true,
          order: 6,
          options: [
            { label: '8 GB', value: '8' },
            { label: '16 GB', value: '16' },
            { label: '32 GB', value: '32' },
            { label: '64 GB', value: '64' },
            { label: '128 GB', value: '128' },
            { label: '256 GB', value: '256' },
            { label: '512 GB', value: '512' },
            { label: '1 TB', value: '1024' },
            { label: 'Altro', value: 'other' }
          ]
        }
      );
    }

    // CASA E GIARDINO
    if (categoryMap['Casa e Giardino']) {
      attributesData.push(
        {
          category: categoryMap['Casa e Giardino'],
          name: 'Materiale',
          key: 'material',
          type: 'select',
          required: false,
          allowVariants: false,
          order: 1,
          options: [
            { label: 'Legno', value: 'wood' },
            { label: 'Metallo', value: 'metal' },
            { label: 'Plastica', value: 'plastic' },
            { label: 'Vetro', value: 'glass' },
            { label: 'Ceramica', value: 'ceramic' },
            { label: 'Tessuto', value: 'fabric' }
          ]
        },
        {
          category: categoryMap['Casa e Giardino'],
          name: 'Colore',
          key: 'color',
          type: 'color',
          required: false,
          allowVariants: false,
          order: 2,
          options: [
            { label: 'Naturale', value: 'natural', color: '#D2B48C' },
            { label: 'Bianco', value: 'white', color: '#FFFFFF' },
            { label: 'Nero', value: 'black', color: '#000000' },
            { label: 'Grigio', value: 'gray', color: '#808080' }
          ]
        }
      );
    }

    // GIOIELLI
    if (categoryMap['Gioielli']) {
      attributesData.push(
        {
          category: categoryMap['Gioielli'],
          name: 'Materiale',
          key: 'material',
          type: 'select',
          required: true,
          allowVariants: false,
          order: 1,
          options: [
            { label: 'Oro 18k', value: 'gold_18k' },
            { label: 'Oro 14k', value: 'gold_14k' },
            { label: 'Argento 925', value: 'silver_925' },
            { label: 'Platino', value: 'platinum' },
            { label: 'Acciaio', value: 'steel' },
            { label: 'Bigiotteria', value: 'fashion' }
          ]
        },
        {
          category: categoryMap['Gioielli'],
          name: 'Taglia',
          key: 'size',
          type: 'select',
          required: false,
          allowVariants: true,
          order: 2,
          options: [
            { label: 'XS (14-16mm)', value: 'xs' },
            { label: 'S (16-18mm)', value: 's' },
            { label: 'M (18-20mm)', value: 'm' },
            { label: 'L (20-22mm)', value: 'l' },
            { label: 'Unica', value: 'one_size' }
          ]
        }
      );
    }

    // Inserisci tutti gli attributi
    if (attributesData.length > 0) {
      await CategoryAttribute.insertMany(attributesData);
      console.log(`✨ Creati ${attributesData.length} attributi per ${Object.keys(categoryMap).length} categorie`);
    } else {
      console.log('⚠️  Nessuna categoria trovata per cui creare attributi');
    }

    console.log('\n🎉 Seed completato con successo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
    process.exit(1);
  }
};

seedCategoryAttributes();
