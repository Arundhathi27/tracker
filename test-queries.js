const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://owovvbujbgbznggnqpaj.supabase.co';
const supabaseKey = 'sb_publishable_AhHGFCr6HEhA1IBFQC8R-A_LhbGg52H';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- TEST START ---');

  // 1. Sign up test user
  const email = `testuser${Date.now()}@budgetwise.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  console.log('User created:', authData.user.id);

  // 2. Wait for profile trigger to finish
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. Create a monthly budget for July
  const { data: budget, error: budgetError } = await supabase
    .from('monthly_budgets')
    .insert({
      user_id: authData.user.id,
      month: '2026-07',
      total_amount: 10000
    })
    .select()
    .single();

  if (budgetError) console.error('Budget error:', budgetError);

  // 4. Create a category
  const { data: category, error: catError } = await supabase
    .from('budget_categories')
    .insert({
      user_id: authData.user.id,
      monthly_budget_id: budget.id,
      name: 'Test Category',
      allocated_amount: 5000,
      color: '#000000',
      icon: 'Heart'
    })
    .select()
    .single();

  if (catError) console.error('Cat error:', catError);

  // 5. Create a transaction for July 30, 2026
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: authData.user.id,
      amount: 100,
      description: 'Test Expense',
      date: '2026-07-30',
      category_id: category.id,
      type: 'expense'
    })
    .select()
    .single();

  if (txError) console.error('Tx error:', txError);
  else console.log('Transaction created successfully!');

  // --- QUERY TEST ---
  const dateStart = '2026-07-01';
  const dateEnd = '2026-07-31';

  // DASHBOARD QUERY
  let dbQuery = supabase.from('transactions').select('*')
    .gte('date', dateStart)
    .lte('date', dateEnd)
    .eq('type', 'expense')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: dbData } = await dbQuery;
  console.log('\n--- DASHBOARD DATA FETCH ---');
  console.log('Query: type=expense, dateStart=2026-07-01, dateEnd=2026-07-31, sortBy=date, sortOrder=desc, limit=5');
  console.log('Result Count:', dbData?.length);

  // ACTIVITY QUERY
  let actQuery = supabase.from('transactions').select('*')
    .gte('date', dateStart)
    .lte('date', dateEnd)
    .eq('type', 'expense')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: actData } = await actQuery;
  console.log('\n--- ACTIVITY DATA FETCH ---');
  console.log('Query: type=expense, dateStart=2026-07-01, dateEnd=2026-07-31, sortBy=date, sortOrder=desc');
  console.log('Result Count:', actData?.length);

  // REPORTS QUERY
  let repQuery = supabase.from('transactions').select('*')
    .gte('date', dateStart)
    .lte('date', dateEnd)
    .eq('type', 'expense')
    .order('date', { ascending: true })
    .order('created_at', { ascending: false });

  const { data: repData } = await repQuery;
  console.log('\n--- REPORTS DATA FETCH ---');
  console.log('Query: type=expense, dateStart=2026-07-01, dateEnd=2026-07-31, sortBy=date, sortOrder=asc');
  console.log('Result Count:', repData?.length);

  // CLEANUP
  await supabase.auth.signOut();
}

run();
