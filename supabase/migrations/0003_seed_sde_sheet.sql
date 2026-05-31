-- Forge — 0003_seed_sde_sheet.sql
-- Seeds the 45-day TakeUForward SDE Sheet challenge for the CURRENTLY
-- AUTHENTICATED user. Run this while signed in (so auth.uid() resolves) and
-- run it only ONCE — re-running creates a duplicate challenge.
-- Everything here is a starting skeleton: edit phases, topics and durations
-- freely afterwards (Forge treats challenges as pure data).
-- Phase durations sum to 45: 7 + 4 + 4 + 4 + 5 + 3 + 6 + 7 + 5.

do $$
declare
  uid     uuid := auth.uid();
  chal_id uuid;
begin
  if uid is null then
    raise exception 'No auth.uid(): run this migration while authenticated.';
  end if;

  insert into challenges (user_id, name, description, start_date, end_date, status)
  values (
    uid,
    'TakeUForward SDE Sheet (45 Days)',
    'Striver SDE Sheet 45-day DSA challenge. Seed skeleton — edit phases, topics and durations to taste.',
    current_date,
    current_date + 44,
    'Active'
  )
  returning id into chal_id;

  insert into challenge_phases (user_id, challenge_id, name, duration_days, sort_order, topics) values
    (uid, chal_id, 'Arrays', 7, 1, array[
      'Arrays basics & two pointers',
      'Kadane / maximum subarray',
      'Prefix sums & subarrays',
      'Sorting-based: Dutch flag, merge intervals',
      'Matrix: rotate, spiral, set zeroes']),
    (uid, chal_id, 'Binary Search', 4, 2, array[
      'Lower/upper bound & BS on answer',
      'Rotated sorted array',
      'Allocation / median of two arrays']),
    (uid, chal_id, 'Strings', 4, 3, array[
      'String basics & hashing',
      'Pattern matching (KMP / Z-function)',
      'Sliding window on strings']),
    (uid, chal_id, 'Linked List', 4, 4, array[
      'Reversal & cycle detection',
      'Merge / sort linked lists',
      'Copy random pointer / LRU cache']),
    (uid, chal_id, 'Recursion & Backtracking', 5, 5, array[
      'Subsets & subsequences',
      'Permutations & combinations',
      'N-Queens / Sudoku / grid backtracking']),
    (uid, chal_id, 'Stacks & Queues', 3, 6, array[
      'Monotonic stack (NGE, histogram)',
      'Implement stack/queue & min-stack']),
    (uid, chal_id, 'Trees', 6, 7, array[
      'Traversals (in/pre/post, level order)',
      'Views, height, diameter, LCA',
      'BST operations & validation',
      'Construct tree from traversals']),
    (uid, chal_id, 'Graphs', 7, 8, array[
      'BFS / DFS / connected components',
      'Topological sort & cycle detection',
      'Shortest path (Dijkstra, Bellman-Ford)',
      'MST (Prim, Kruskal) & DSU']),
    (uid, chal_id, 'Dynamic Programming', 5, 9, array[
      'DP on subsequences / knapsack',
      'DP on strings (LCS, edit distance)',
      'DP on grids & stocks',
      'MCM / partition DP']);
end $$;
