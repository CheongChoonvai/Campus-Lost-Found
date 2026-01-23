'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function makeMissingClient() {
	const missing = () => {
		throw new Error(
			'Supabase client not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env'
		);
	};

	return {
		auth: {
			signInWithPassword: async () => missing(),
			signUp: async () => missing(),
			getUser: async () => missing(),
			signOut: async () => missing(),
		},
		from: () => ({ select: async () => missing() }),
	} as any;
}

let supabase: any;
if (supabaseUrl && supabaseAnonKey) {
	supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
	// Avoid throwing during module evaluation; provide a clear runtime error when used.
	// This prevents Next from crashing at startup if envs are not loaded yet.
	// Developers should restart the dev server after adding `.env` or set vars in their environment.
	// Log a warning for visibility.
	// eslint-disable-next-line no-console
	console.warn('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
	supabase = makeMissingClient();
}

export { supabase };
