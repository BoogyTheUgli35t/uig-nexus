-- Intelligence deep-build: persistent multi-turn AI assistant chat (previously a
-- single one-shot Q&A with no history). Explainability visuals and cross-division
-- "Use AI" links are UI-only additions and need no schema changes.

CREATE TABLE public.ai_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.ai_chat_messages TO authenticated;
GRANT ALL ON public.ai_chat_messages TO service_role;

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own chat messages" ON public.ai_chat_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "users insert own chat messages" ON public.ai_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "users delete own chat messages" ON public.ai_chat_messages
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX ai_chat_messages_user_created_idx ON public.ai_chat_messages (user_id, created_at);
