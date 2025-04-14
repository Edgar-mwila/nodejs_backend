import type { Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';

class OAuthController {
    constructor() {
        this.initializeStrategies();
    }

    private initializeStrategies(): void {
        // Google Strategy
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID!,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                    callbackURL: '/auth/google/callback',
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        // Here you would typically:
                        // 1. Check if user exists in your database
                        // 2. Create new user if they don't exist
                        // 3. Return user object
                        return done(null, profile);
                    } catch (error) {
                        return done(error as Error, undefined);
                    }
                }
            )
        );

        // Facebook Strategy
        passport.use(
            new FacebookStrategy(
                {
                    clientID: process.env.FACEBOOK_APP_ID!,
                    clientSecret: process.env.FACEBOOK_APP_SECRET!,
                    callbackURL: '/auth/facebook/callback',
                    profileFields: ['id', 'emails', 'name'],
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        // Similar to Google strategy
                        return done(null, profile);
                    } catch (error) {
                        return done(error as Error, undefined);
                    }
                }
            )
        );
    }

    // Route handlers
    public googleAuth = passport.authenticate('google', {
        scope: ['profile', 'email'],
    });

    public googleAuthCallback = [
        passport.authenticate('google', { failureRedirect: '/login' }),
        (req: Request, res: Response) => {
            res.redirect('/');
        },
    ];

    public facebookAuth = passport.authenticate('facebook', {
        scope: ['email'],
    });

    public facebookAuthCallback = [
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        (req: Request, res: Response) => {
            res.redirect('/');
        },
    ];

    public logout = (req: Request, res: Response) => {
        req.logout(() => {
            res.redirect('/');
        });
    };
}

export default new OAuthController();