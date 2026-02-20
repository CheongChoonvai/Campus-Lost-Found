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
	console.warn('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
	supabase = makeMissingClient();
}

export { supabase };
