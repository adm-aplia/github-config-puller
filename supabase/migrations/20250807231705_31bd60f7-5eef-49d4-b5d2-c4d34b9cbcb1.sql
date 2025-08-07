-- Atualizar o last_message_at da conversa da Maria Silva para a última mensagem
UPDATE public.conversations 
SET last_message_at = (
    SELECT MAX(created_at) 
    FROM public.messages 
    WHERE conversation_id = '634b8c71-4e85-4784-87d1-ea339f2edb44'
)
WHERE id = '634b8c71-4e85-4784-87d1-ea339f2edb44';