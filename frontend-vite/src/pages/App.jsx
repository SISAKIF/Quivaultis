import Ticket from "./pages/Ticket";
import Wallet from "./pages/Wallet";
import Inventory from "./pages/Inventory";
import Inventory from "./pages/Inventory";
<Route
path="/tickets"
element={<Ticket/>}
/>
<Routes>
<Route 
path="/"
element={<Home/>}
/>
<Route
path="/reviews"
element={<CommunityReviews/>}
/>


<Route
path="/tickets"
element={<Ticket/>}
/>


<Route
path="/wallet"
element={<Wallet/>}
/>
<Route
path="/inventory"
element={<Inventory/>}
/>

</Routes>