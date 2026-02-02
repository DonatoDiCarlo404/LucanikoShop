import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHelmet = ({ 
  title = 'Lucaniko Shop - Il primo centro commerciale della Basilicata',
  description = 'Il primo centro commerciale della Basilicata. Acquista online prodotti tipici lucani: salumi artigianali, formaggi, pasta, conserve, vini e specialità della tradizione lucana.',
  keywords = 'lucaniko shop, lucaniko, prodotti tipici lucani, prodotti tipici della Basilicata, specialità lucane, salumi lucani, formaggi lucani, pasta artigianale lucana',
  image = 'https://lucanikoshop.it/Lucaniko Shop PNG solo testo-01.png',
  url = 'https://lucanikoshop.it/',
  type = 'website'
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Lucaniko Shop" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEOHelmet;
