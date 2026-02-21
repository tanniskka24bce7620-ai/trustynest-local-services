
-- Insert demo users into auth.users for testing purposes
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rajesh.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Rajesh Kumar"}'),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'suresh.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Suresh Sharma"}'),
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'meena.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Meena Devi"}'),
  ('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'arun.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Arun Patel"}'),
  ('a5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lakshmi.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Lakshmi Iyer"}'),
  ('a6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vikram.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Vikram Singh"}'),
  ('a7777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Priya Nair"}'),
  ('a8888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mohammed.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Mohammed Ali"}'),
  ('a9999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'deepa.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Deepa Kumari"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ravi.demo@servnest.test', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"name":"Ravi Teja"}');

-- Insert identities for demo users
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'rajesh.demo@servnest.test', '{"sub":"a1111111-1111-1111-1111-111111111111","email":"rajesh.demo@servnest.test"}', 'email', now(), now(), now()),
  ('a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'suresh.demo@servnest.test', '{"sub":"a2222222-2222-2222-2222-222222222222","email":"suresh.demo@servnest.test"}', 'email', now(), now(), now()),
  ('a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'meena.demo@servnest.test', '{"sub":"a3333333-3333-3333-3333-333333333333","email":"meena.demo@servnest.test"}', 'email', now(), now(), now()),
  ('a4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'arun.demo@servnest.test', '{"sub":"a4444444-4444-4444-4444-444444444444","email":"arun.demo@servnest.test"}', 'email', now(), now(), now()),
  ('a5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'lakshmi.demo@servnest.test', '{"sub":"a5555555-5555-5555-5555-555555555555","email":"lakshmi.demo@servnest.test"}', 'email', now(), now(), now()),
  ('a6666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'vikram.demo@servnest.test', '{"sub":"a6666666-6666-6666-6666-666666666666","email":"vikram.demo@servnest.test"}', 'email', now(), now(), now()),
  ('a7777777-7777-7777-7777-777777777777', 'a7777777-7777-7777-7777-777777777777', 'priya.demo@servnest.test', '{"sub":"a7777777-7777-7777-7777-777777777777","email":"priya.demo@servnest.test"}', 'email', now(), now(), now()),
  ('a8888888-8888-8888-8888-888888888888', 'a8888888-8888-8888-8888-888888888888', 'mohammed.demo@servnest.test', '{"sub":"a8888888-8888-8888-8888-888888888888","email":"mohammed.demo@servnest.test"}', 'email', now(), now(), now()),
  ('a9999999-9999-9999-9999-999999999999', 'a9999999-9999-9999-9999-999999999999', 'deepa.demo@servnest.test', '{"sub":"a9999999-9999-9999-9999-999999999999","email":"deepa.demo@servnest.test"}', 'email', now(), now(), now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ravi.demo@servnest.test', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"ravi.demo@servnest.test"}', 'email', now(), now(), now());

-- The handle_new_user trigger will auto-create profiles, but we need to update them with details
-- and also create service_profiles and user_roles

-- Update profiles with demo data
UPDATE profiles SET name = 'Rajesh Kumar', city = 'Chennai', area = 'Anna Nagar', contact = '9876543210', aadhaar_verified = true, profile_complete = true WHERE user_id = 'a1111111-1111-1111-1111-111111111111';
UPDATE profiles SET name = 'Suresh Sharma', city = 'Mumbai', area = 'Andheri West', contact = '9876543211', aadhaar_verified = true, profile_complete = true WHERE user_id = 'a2222222-2222-2222-2222-222222222222';
UPDATE profiles SET name = 'Meena Devi', city = 'Bangalore', area = 'Koramangala', contact = '9876543212', aadhaar_verified = true, profile_complete = true WHERE user_id = 'a3333333-3333-3333-3333-333333333333';
UPDATE profiles SET name = 'Arun Patel', city = 'Delhi', area = 'Dwarka', contact = '9876543213', aadhaar_verified = true, profile_complete = true WHERE user_id = 'a4444444-4444-4444-4444-444444444444';
UPDATE profiles SET name = 'Lakshmi Iyer', city = 'Chennai', area = 'T. Nagar', contact = '9876543214', aadhaar_verified = true, profile_complete = true WHERE user_id = 'a5555555-5555-5555-5555-555555555555';
UPDATE profiles SET name = 'Vikram Singh', city = 'Pune', area = 'Kothrud', contact = '9876543215', aadhaar_verified = true, profile_complete = true WHERE user_id = 'a6666666-6666-6666-6666-666666666666';
UPDATE profiles SET name = 'Priya Nair', city = 'Hyderabad', area = 'Banjara Hills', contact = '9876543216', aadhaar_verified = true, profile_complete = true WHERE user_id = 'a7777777-7777-7777-7777-777777777777';
UPDATE profiles SET name = 'Mohammed Ali', city = 'Kolkata', area = 'Salt Lake', contact = '9876543217', aadhaar_verified = true, profile_complete = true WHERE user_id = 'a8888888-8888-8888-8888-888888888888';
UPDATE profiles SET name = 'Deepa Kumari', city = 'Bangalore', area = 'Indiranagar', contact = '9876543218', aadhaar_verified = true, profile_complete = true WHERE user_id = 'a9999999-9999-9999-9999-999999999999';
UPDATE profiles SET name = 'Ravi Teja', city = 'Hyderabad', area = 'Madhapur', contact = '9876543219', aadhaar_verified = true, profile_complete = true WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Insert provider roles
INSERT INTO user_roles (user_id, role) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'provider'),
  ('a2222222-2222-2222-2222-222222222222', 'provider'),
  ('a3333333-3333-3333-3333-333333333333', 'provider'),
  ('a4444444-4444-4444-4444-444444444444', 'provider'),
  ('a5555555-5555-5555-5555-555555555555', 'provider'),
  ('a6666666-6666-6666-6666-666666666666', 'provider'),
  ('a7777777-7777-7777-7777-777777777777', 'provider'),
  ('a8888888-8888-8888-8888-888888888888', 'provider'),
  ('a9999999-9999-9999-9999-999999999999', 'provider'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'provider');

-- Insert service profiles
INSERT INTO service_profiles (user_id, service_type, experience, bio, rating, review_count, available, age) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Carpenter', 12, 'Expert in custom furniture, door fitting, and wood repairs. 12 years of trusted experience.', 4.5, 28, true, 38),
  ('a2222222-2222-2222-2222-222222222222', 'Electrician', 8, 'Licensed electrician specializing in wiring, switchboard repairs, and appliance installation.', 4.2, 19, true, 32),
  ('a3333333-3333-3333-3333-333333333333', 'Tailor', 15, 'Professional tailor for blouse stitching, alterations, and custom dress designing.', 4.8, 45, true, 42),
  ('a4444444-4444-4444-4444-444444444444', 'Plumber', 10, 'All plumbing solutions including pipe fitting, leak repair, and bathroom installation.', 4.0, 15, true, 35),
  ('a5555555-5555-5555-5555-555555555555', 'Mehendi Artist', 7, 'Bridal and festival mehendi designs. Specializing in Arabic and Indian patterns.', 4.9, 62, true, 29),
  ('a6666666-6666-6666-6666-666666666666', 'Painter', 14, 'Interior and exterior painting, texture work, and waterproofing specialist.', 4.3, 22, true, 40),
  ('a7777777-7777-7777-7777-777777777777', 'House Maid', 5, 'Reliable house cleaning, cooking, and household management services.', 4.6, 33, true, 34),
  ('a8888888-8888-8888-8888-888888888888', 'Mechanic', 18, 'Automobile repair specialist for cars and two-wheelers. Engine and AC servicing.', 4.4, 38, true, 45),
  ('a9999999-9999-9999-9999-999999999999', 'Cobbler', 9, 'Shoe repair, polishing, and custom leather work. Quick and quality service.', 4.1, 12, true, 36),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Electrician', 6, 'Smart home setup, CCTV installation, and electrical maintenance.', 4.7, 27, true, 30);
