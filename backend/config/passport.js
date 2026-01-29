import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔵 [PASSPORT] Google Strategy chiamata');
        console.log('📧 [PASSPORT] Email:', profile.emails[0].value);
        console.log('👤 [PASSPORT] Nome:', profile.displayName);
        
        // Cerca se l'utente esiste già
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          console.log('✅ [PASSPORT] Utente esistente trovato:', { id: user._id, role: user.role });
          // Utente esistente
          return done(null, user);
        } else {
          console.log('➕ [PASSPORT] Creazione nuovo utente...');
          // Crea nuovo utente
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            password: 'google-oauth-' + Math.random().toString(36).slice(-8), // Password casuale
            isVerified: true, // Google ha già verificato l'email
          });
          console.log('✅ [PASSPORT] Nuovo utente creato:', { id: user._id, role: user.role });
          return done(null, user);
        }
      } catch (error) {
        console.error('❌ [PASSPORT] Errore:', error);
        return done(error, null);
      }
    }
  )
);

export default passport;