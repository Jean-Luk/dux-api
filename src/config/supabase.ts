import { createClient } from '@supabase/supabase-js';
import logger from './logger';

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY

if (!SUPABASE_URL || !SUPABASE_API_KEY) {
    logger.error("Configurações da Supabase não especificadas");
}

export const supabase = createClient(
	SUPABASE_URL!,
	SUPABASE_API_KEY!
);