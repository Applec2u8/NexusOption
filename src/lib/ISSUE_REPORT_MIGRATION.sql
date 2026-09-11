-- 1. Create a sequence for Smart IDs (Starting from 1001)
CREATE SEQUENCE IF NOT EXISTS issue_report_smart_id_seq START WITH 1001;

-- 2. Create the issue_reports table
CREATE TABLE IF NOT EXISTS public.issue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    smart_id BIGINT DEFAULT nextval('issue_report_smart_id_seq'),
    category TEXT NOT NULL, -- e.g., #Deposit, #Withdraw, #Trade, #Security, #Other
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    admin_response TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view their own reports
CREATE POLICY "Users can view own reports" 
    ON public.issue_reports FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports" 
    ON public.issue_reports FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Admins can view everything
CREATE POLICY "Admins can view all reports" 
    ON public.issue_reports FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Admins can update reports (responses/status)
CREATE POLICY "Admins can update reports" 
    ON public.issue_reports FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_issue_reports_updated_at
    BEFORE UPDATE ON public.issue_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Grant access
GRANT ALL ON public.issue_reports TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE issue_report_smart_id_seq TO authenticated;

COMMENT ON TABLE public.issue_reports IS 'Stores user-reported problems and admin responses with smart IDs and categorization.';
