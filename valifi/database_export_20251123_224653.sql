--
-- PostgreSQL database dump
--

\restrict bKPuPwfJI8baVIJM24m4GCfUoyD4H0bWDGm5JyOcP0kjkdKjijcLRTQNOky041w

-- Dumped from database version 16.9 (415ebe8)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: asset_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.asset_status AS ENUM (
    'Active',
    'Pending',
    'Matured',
    'Withdrawable',
    'Withdrawn',
    'Collateralized'
);


ALTER TYPE public.asset_status OWNER TO neondb_owner;

--
-- Name: asset_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.asset_type AS ENUM (
    'Crypto',
    'PreciousMetal',
    'Fiat'
);


ALTER TYPE public.asset_type OWNER TO neondb_owner;

--
-- Name: bank_account_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.bank_account_status AS ENUM (
    'Pending',
    'Verified',
    'Rejected'
);


ALTER TYPE public.bank_account_status OWNER TO neondb_owner;

--
-- Name: card_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.card_status AS ENUM (
    'Not Applied',
    'Pending Approval',
    'Approved',
    'Frozen',
    'Cancelled'
);


ALTER TYPE public.card_status OWNER TO neondb_owner;

--
-- Name: card_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.card_type AS ENUM (
    'Virtual',
    'Physical'
);


ALTER TYPE public.card_type OWNER TO neondb_owner;

--
-- Name: investment_action; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.investment_action AS ENUM (
    'Buy',
    'Reward',
    'Withdrawal',
    'Sell'
);


ALTER TYPE public.investment_action OWNER TO neondb_owner;

--
-- Name: kyc_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.kyc_status AS ENUM (
    'Not Started',
    'Pending',
    'Approved',
    'Rejected',
    'Resubmit Required'
);


ALTER TYPE public.kyc_status OWNER TO neondb_owner;

--
-- Name: loan_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.loan_status AS ENUM (
    'Pending',
    'Approved',
    'Active',
    'Repaid',
    'Late',
    'Defaulted',
    'Rejected'
);


ALTER TYPE public.loan_status OWNER TO neondb_owner;

--
-- Name: p2p_offer_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.p2p_offer_type AS ENUM (
    'buy',
    'sell'
);


ALTER TYPE public.p2p_offer_type OWNER TO neondb_owner;

--
-- Name: p2p_order_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.p2p_order_status AS ENUM (
    'created',
    'escrowed',
    'paid',
    'released',
    'disputed',
    'cancelled',
    'completed'
);


ALTER TYPE public.p2p_order_status OWNER TO neondb_owner;

--
-- Name: payout_destination; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.payout_destination AS ENUM (
    'wallet',
    'balance'
);


ALTER TYPE public.payout_destination OWNER TO neondb_owner;

--
-- Name: transaction_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'confirmed',
    'failed'
);


ALTER TYPE public.transaction_status OWNER TO neondb_owner;

--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.transaction_type AS ENUM (
    'Deposit',
    'Withdrawal',
    'Trade',
    'P2P',
    'Loan Repayment',
    'Exchange',
    'Transfer'
);


ALTER TYPE public.transaction_type OWNER TO neondb_owner;

--
-- Name: two_factor_method; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.two_factor_method AS ENUM (
    'none',
    'email',
    'sms',
    'authenticator'
);


ALTER TYPE public.two_factor_method OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.active_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    device character varying(255),
    location character varying(255),
    ip_address inet,
    last_active timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.active_sessions OWNER TO neondb_owner;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    admin_user_id character varying NOT NULL,
    action character varying(255) NOT NULL,
    target_id character varying(255),
    target_type character varying(100),
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admin_audit_logs OWNER TO neondb_owner;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    role character varying(50) DEFAULT 'admin'::character varying,
    permissions jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admin_users OWNER TO neondb_owner;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.assets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    name character varying(255) NOT NULL,
    ticker character varying(20) NOT NULL,
    type public.asset_type DEFAULT 'Crypto'::public.asset_type NOT NULL,
    balance numeric(36,18) DEFAULT 0,
    balance_in_escrow numeric(36,18) DEFAULT 0,
    value_usd numeric(36,2) DEFAULT 0,
    initial_investment numeric(36,2) DEFAULT 0,
    total_earnings numeric(36,2) DEFAULT 0,
    status public.asset_status DEFAULT 'Active'::public.asset_status,
    maturity_date timestamp with time zone,
    payout_destination public.payout_destination DEFAULT 'balance'::public.payout_destination,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.assets OWNER TO neondb_owner;

--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bank_accounts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    country_code character varying(5) NOT NULL,
    nickname character varying(255),
    details jsonb,
    status public.bank_account_status DEFAULT 'Pending'::public.bank_account_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bank_accounts OWNER TO neondb_owner;

--
-- Name: exchange_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.exchange_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    trading_pair text NOT NULL,
    price numeric(36,18),
    amount numeric(36,18) NOT NULL,
    filled numeric(36,18) DEFAULT '0'::numeric,
    total numeric(36,18),
    fees numeric(36,18),
    external_order_id text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


ALTER TABLE public.exchange_orders OWNER TO neondb_owner;

--
-- Name: kyc_records; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.kyc_records (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    sumsub_applicant_id text,
    document_type text,
    review_result jsonb,
    rejection_reason text,
    submitted_at timestamp without time zone DEFAULT now(),
    reviewed_at timestamp without time zone
);


ALTER TABLE public.kyc_records OWNER TO neondb_owner;

--
-- Name: loan_applications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.loan_applications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    amount numeric(36,2) NOT NULL,
    term integer NOT NULL,
    interest_rate numeric(5,2) NOT NULL,
    collateral_asset_id character varying,
    contacts_file text,
    status public.loan_status DEFAULT 'Pending'::public.loan_status,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.loan_applications OWNER TO neondb_owner;

--
-- Name: p2p_chat_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.p2p_chat_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    sender_id character varying NOT NULL,
    message text NOT NULL,
    attachments text[],
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.p2p_chat_messages OWNER TO neondb_owner;

--
-- Name: p2p_disputes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.p2p_disputes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    raised_by character varying NOT NULL,
    reason text NOT NULL,
    evidence jsonb,
    resolution text,
    resolved_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone
);


ALTER TABLE public.p2p_disputes OWNER TO neondb_owner;

--
-- Name: p2p_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.p2p_offers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type public.p2p_offer_type NOT NULL,
    cryptocurrency text NOT NULL,
    amount numeric(36,18) NOT NULL,
    fiat_currency text NOT NULL,
    price_per_unit numeric(12,2) NOT NULL,
    payment_methods text[],
    min_amount numeric(36,18),
    max_amount numeric(36,18),
    time_limit integer DEFAULT 30,
    terms text,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone
);


ALTER TABLE public.p2p_offers OWNER TO neondb_owner;

--
-- Name: p2p_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.p2p_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    offer_id character varying NOT NULL,
    buyer_id character varying NOT NULL,
    seller_id character varying NOT NULL,
    amount numeric(36,18) NOT NULL,
    fiat_amount numeric(12,2) NOT NULL,
    payment_method text NOT NULL,
    status public.p2p_order_status DEFAULT 'created'::public.p2p_order_status,
    escrow_tx_hash text,
    release_tx_hash text,
    dispute_reason text,
    created_at timestamp without time zone DEFAULT now(),
    paid_at timestamp without time zone,
    completed_at timestamp without time zone
);


ALTER TABLE public.p2p_orders OWNER TO neondb_owner;

--
-- Name: p2p_payment_methods; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.p2p_payment_methods (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type text NOT NULL,
    details jsonb,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.p2p_payment_methods OWNER TO neondb_owner;

--
-- Name: p2p_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.p2p_reviews (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    reviewer_id character varying NOT NULL,
    reviewed_user_id character varying NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.p2p_reviews OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    wallet_id character varying NOT NULL,
    tx_hash text,
    type public.transaction_type NOT NULL,
    "from" text NOT NULL,
    "to" text NOT NULL,
    value numeric(36,18),
    gas_used text,
    status public.transaction_status DEFAULT 'pending'::public.transaction_status,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    confirmed_at timestamp without time zone
);


ALTER TABLE public.transactions OWNER TO neondb_owner;

--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    two_factor_enabled boolean DEFAULT false,
    two_factor_method public.two_factor_method DEFAULT 'none'::public.two_factor_method,
    two_factor_secret text,
    login_alerts boolean DEFAULT true,
    preferences jsonb,
    privacy jsonb,
    vault_recovery jsonb
);


ALTER TABLE public.user_settings OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    password_hash character varying,
    profile_image_url character varying,
    kyc_status public.kyc_status DEFAULT 'Not Started'::public.kyc_status,
    kyc_user_id text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    full_name character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    profile_photo_url text,
    kyc_rejection_reason text
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: valifi_cards; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.valifi_cards (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    status public.card_status DEFAULT 'Not Applied'::public.card_status,
    type public.card_type,
    currency character varying(10),
    theme character varying(50),
    card_number_hash character varying(255),
    expiry text,
    cvv_hash character varying(255),
    is_frozen boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.valifi_cards OWNER TO neondb_owner;

--
-- Data for Name: active_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.active_sessions (id, user_id, device, location, ip_address, last_active, created_at) FROM stdin;
\.


--
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admin_audit_logs (id, admin_user_id, action, target_id, target_type, details, created_at) FROM stdin;
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admin_users (id, user_id, role, permissions, created_at) FROM stdin;
08d974e0-c5e3-456d-a75a-e93f5b72e108	871a55a6-2dfb-472e-8ebf-a08200ad8f43	super_admin	{}	2025-11-23 21:42:43.416863+00
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.assets (id, user_id, name, ticker, type, balance, balance_in_escrow, value_usd, initial_investment, total_earnings, status, maturity_date, payout_destination, details, created_at, updated_at) FROM stdin;
ba11a9c7-d698-486f-9aac-049d4300b60e	871a55a6-2dfb-472e-8ebf-a08200ad8f43	US Dollar	USD	Fiat	0.000000000000000000	0.000000000000000000	0.00	0.00	0.00	Active	\N	balance	\N	2025-11-23 21:39:03.144226+00	2025-11-23 21:39:03.144226+00
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bank_accounts (id, user_id, country_code, nickname, details, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: exchange_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.exchange_orders (id, user_id, trading_pair, price, amount, filled, total, fees, external_order_id, expires_at, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: kyc_records; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.kyc_records (id, user_id, sumsub_applicant_id, document_type, review_result, rejection_reason, submitted_at, reviewed_at) FROM stdin;
\.


--
-- Data for Name: loan_applications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.loan_applications (id, user_id, amount, term, interest_rate, collateral_asset_id, contacts_file, status, details, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: p2p_chat_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.p2p_chat_messages (id, order_id, sender_id, message, attachments, created_at) FROM stdin;
\.


--
-- Data for Name: p2p_disputes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.p2p_disputes (id, order_id, raised_by, reason, evidence, resolution, resolved_by, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: p2p_offers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.p2p_offers (id, user_id, type, cryptocurrency, amount, fiat_currency, price_per_unit, payment_methods, min_amount, max_amount, time_limit, terms, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: p2p_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.p2p_orders (id, offer_id, buyer_id, seller_id, amount, fiat_amount, payment_method, status, escrow_tx_hash, release_tx_hash, dispute_reason, created_at, paid_at, completed_at) FROM stdin;
\.


--
-- Data for Name: p2p_payment_methods; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.p2p_payment_methods (id, user_id, type, details, is_verified, created_at) FROM stdin;
\.


--
-- Data for Name: p2p_reviews; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.p2p_reviews (id, order_id, reviewer_id, reviewed_user_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (id, wallet_id, tx_hash, type, "from", "to", value, gas_used, status, metadata, created_at, confirmed_at) FROM stdin;
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_settings (id, user_id, two_factor_enabled, two_factor_method, two_factor_secret, login_alerts, preferences, privacy, vault_recovery) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password_hash, profile_image_url, kyc_status, kyc_user_id, created_at, updated_at, full_name, username, profile_photo_url, kyc_rejection_reason) FROM stdin;
5f9a1dd4-a7d4-425d-9788-76c76fb62f11	qatest_48583e25@valifi.test	$2b$10$4yHacasxoy.Hw5T.RP2kpuUCm0ReQt1NH37gijCBVapXP14oM841G		Pending	\N	2025-11-23 16:44:25.569236	2025-11-23 16:44:25.569236	User	user_5f9a1dd4-a7d4-425d-9788-76c76fb62f11	\N	\N
70dc497a-25f4-49dd-b272-915ddc02720c	qatest_2f21ba6a@valifi.test	$2b$10$G0Xry1EgsCrovbjrbLg3M.bQ.cBtsDEghvlJFCYPB4hl6JwuN49Ny		Pending	\N	2025-11-23 16:45:58.094366	2025-11-23 16:45:58.094366	User	user_70dc497a-25f4-49dd-b272-915ddc02720c	\N	\N
efa6c5fe-f4f1-4783-b1b2-8f73ba45cfe6	qatest_a0687831@valifi.test	$2b$10$4YIqDPzUUZQ3VT6YkjywLuFzyfwbOnYlaM9vX6jPbZ3e0njdZiVTu		Pending	\N	2025-11-23 16:47:04.647905	2025-11-23 16:47:04.647905	User	user_efa6c5fe-f4f1-4783-b1b2-8f73ba45cfe6	\N	\N
d1447bb6-6e28-4b11-84d2-083febbbe74d	qatest_2a04f65a@valifi.test	$2b$10$w9D3tvAaDDXCPbpmfCq6rurk0nRvWiEjpnBW3x5kMZfnBSf1xB372		Pending	\N	2025-11-23 16:48:24.930132	2025-11-23 16:48:24.930132	User	user_d1447bb6-6e28-4b11-84d2-083febbbe74d	\N	\N
ccb6c965-eaf4-4e0a-96f8-db7f611e6a75	qatest_b54e285b@valifi.test	$2b$10$SKg4WEPApByWEACkToSy2uf35G8pGZeS2rUKbz0hhXz4cnTszdGxa		Pending	\N	2025-11-23 18:43:32.312143	2025-11-23 18:43:32.312143	User	user_ccb6c965-eaf4-4e0a-96f8-db7f611e6a75	\N	\N
21345b20-9f17-43f1-a7ef-53f8671cbc8c	qatest_271c5975@valifi.test	$2b$10$Vq2Lp.foAtMY.yFOmUZGgu.pFlZI7I21PISBdT8rYkuXgs72HVdx.		Pending	\N	2025-11-23 19:29:54.988537	2025-11-23 19:29:54.988537	User	user_21345b20-9f17-43f1-a7ef-53f8671cbc8c	\N	\N
5a329552-61ea-47bd-b343-8579c5fa69dc	ilabeliman@gmail.com	$2b$10$P8nXbtNwoEuLLvx51lieqerwyBJBrQyQr6xPaKkar.t/hcICvQw9e		Pending	\N	2025-11-23 21:03:09.183382	2025-11-23 21:03:09.183382	User	user_5a329552-61ea-47bd-b343-8579c5fa69dc	\N	\N
871a55a6-2dfb-472e-8ebf-a08200ad8f43	iamiamiam14all@gmail.com	$2b$10$MDK6JWn30LhsPic2wu4JJezFiYdUK/UzHO8CEFuPr6ck6rGR8AcIK		Approved	\N	2025-11-23 17:06:11.924805	2025-11-23 17:06:11.924805	Super Admin	superadmin	\N	\N
cc1d1590-5257-4dd5-a5d1-bd7a2dd27616	test@example.com	$2b$10$woTQMaUDv0O0znNy3UAxnehsv1V3vZXsivnES.j1Tk.u9fu25JPwW	\N	Not Started	\N	2025-11-23 22:40:59.27047	2025-11-23 22:40:59.27047	Test User	testuser		\N
\.


--
-- Data for Name: valifi_cards; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.valifi_cards (id, user_id, status, type, currency, theme, card_number_hash, expiry, cvv_hash, is_frozen, created_at, updated_at) FROM stdin;
\.


--
-- Name: active_sessions active_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: exchange_orders exchange_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exchange_orders
    ADD CONSTRAINT exchange_orders_pkey PRIMARY KEY (id);


--
-- Name: kyc_records kyc_records_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.kyc_records
    ADD CONSTRAINT kyc_records_pkey PRIMARY KEY (id);


--
-- Name: kyc_records kyc_records_sumsub_applicant_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.kyc_records
    ADD CONSTRAINT kyc_records_sumsub_applicant_id_unique UNIQUE (sumsub_applicant_id);


--
-- Name: loan_applications loan_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT loan_applications_pkey PRIMARY KEY (id);


--
-- Name: p2p_chat_messages p2p_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_chat_messages
    ADD CONSTRAINT p2p_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: p2p_disputes p2p_disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_disputes
    ADD CONSTRAINT p2p_disputes_pkey PRIMARY KEY (id);


--
-- Name: p2p_offers p2p_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_offers
    ADD CONSTRAINT p2p_offers_pkey PRIMARY KEY (id);


--
-- Name: p2p_orders p2p_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_orders
    ADD CONSTRAINT p2p_orders_pkey PRIMARY KEY (id);


--
-- Name: p2p_payment_methods p2p_payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_payment_methods
    ADD CONSTRAINT p2p_payment_methods_pkey PRIMARY KEY (id);


--
-- Name: p2p_reviews p2p_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_reviews
    ADD CONSTRAINT p2p_reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_tx_hash_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_tx_hash_unique UNIQUE (tx_hash);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: valifi_cards valifi_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.valifi_cards
    ADD CONSTRAINT valifi_cards_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: active_sessions active_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: admin_audit_logs admin_audit_logs_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id);


--
-- Name: admin_users admin_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: assets assets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bank_accounts bank_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: exchange_orders exchange_orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exchange_orders
    ADD CONSTRAINT exchange_orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: kyc_records kyc_records_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.kyc_records
    ADD CONSTRAINT kyc_records_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: loan_applications loan_applications_collateral_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT loan_applications_collateral_asset_id_fkey FOREIGN KEY (collateral_asset_id) REFERENCES public.assets(id);


--
-- Name: loan_applications loan_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT loan_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: p2p_chat_messages p2p_chat_messages_order_id_p2p_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_chat_messages
    ADD CONSTRAINT p2p_chat_messages_order_id_p2p_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.p2p_orders(id);


--
-- Name: p2p_chat_messages p2p_chat_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_chat_messages
    ADD CONSTRAINT p2p_chat_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: p2p_disputes p2p_disputes_order_id_p2p_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_disputes
    ADD CONSTRAINT p2p_disputes_order_id_p2p_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.p2p_orders(id);


--
-- Name: p2p_disputes p2p_disputes_raised_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_disputes
    ADD CONSTRAINT p2p_disputes_raised_by_users_id_fk FOREIGN KEY (raised_by) REFERENCES public.users(id);


--
-- Name: p2p_offers p2p_offers_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_offers
    ADD CONSTRAINT p2p_offers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: p2p_orders p2p_orders_buyer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_orders
    ADD CONSTRAINT p2p_orders_buyer_id_users_id_fk FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: p2p_orders p2p_orders_offer_id_p2p_offers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_orders
    ADD CONSTRAINT p2p_orders_offer_id_p2p_offers_id_fk FOREIGN KEY (offer_id) REFERENCES public.p2p_offers(id);


--
-- Name: p2p_orders p2p_orders_seller_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_orders
    ADD CONSTRAINT p2p_orders_seller_id_users_id_fk FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: p2p_payment_methods p2p_payment_methods_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_payment_methods
    ADD CONSTRAINT p2p_payment_methods_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: p2p_reviews p2p_reviews_order_id_p2p_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_reviews
    ADD CONSTRAINT p2p_reviews_order_id_p2p_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.p2p_orders(id);


--
-- Name: p2p_reviews p2p_reviews_reviewed_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_reviews
    ADD CONSTRAINT p2p_reviews_reviewed_user_id_users_id_fk FOREIGN KEY (reviewed_user_id) REFERENCES public.users(id);


--
-- Name: p2p_reviews p2p_reviews_reviewer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.p2p_reviews
    ADD CONSTRAINT p2p_reviews_reviewer_id_users_id_fk FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: valifi_cards valifi_cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.valifi_cards
    ADD CONSTRAINT valifi_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict bKPuPwfJI8baVIJM24m4GCfUoyD4H0bWDGm5JyOcP0kjkdKjijcLRTQNOky041w

