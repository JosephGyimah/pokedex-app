import 'react-native-gesture-handler';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FavoritesContext = createContext();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const API_BASE = 'https://pokeapi.co/api/v2';

const typeColors = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const formatNumber = (value) => {
  if (value === undefined || value === null) return 'N/A';
  return `N°${String(value).padStart(3, '0')}`;
};

const titleCase = (value) =>
  (value || '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

function PokemonCard({ name, image, number, onPress, isFavorite, toggleFavorite }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardInner}>
        <View style={styles.cardTextArea}>
          <Text style={styles.cardNumber}>{formatNumber(number)}</Text>
          <Text style={styles.cardName}>{titleCase(name)}</Text>
          <View style={styles.typeWrap}>
            <Text style={styles.typePill}>Type</Text>
          </View>
        </View>

        <View style={styles.imageArea}>
          <Image source={{ uri: image }} style={styles.cardImage} resizeMode="contain" />
          <Pressable
            style={styles.favoriteButton}
            onPress={(event) => {
              event.stopPropagation();
              toggleFavorite(name);
            }}
            hitSlop={10}
            accessibilityLabel={isFavorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#ff5d7a' : '#f8f8f8'}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function HomeScreen({ navigation }) {
  const { favorites, toggleFavorite } = useContext(FavoritesContext);
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchPokemon = async () => {
      try {
        setLoading(true);
        setError('');

        const listResponse = await fetch(`${API_BASE}/pokemon?limit=12`);
        if (!listResponse.ok) {
          throw new Error('Failed to fetch Pokémon list');
        }

        const listData = await listResponse.json();
        const details = await Promise.all(
          listData.results.map(async (item) => {
            const detailResponse = await fetch(item.url);
            if (!detailResponse.ok) {
              throw new Error('Failed to fetch Pokémon details');
            }

            const detail = await detailResponse.json();
            return {
              id: detail.id,
              name: detail.name,
              image: detail.sprites.other['official-artwork'].front_default,
              type: detail.types[0]?.type.name || 'normal',
            };
          })
        );

        if (isMounted) {
          setPokemon(details);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message || 'Something went wrong');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPokemon();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.openDrawer()} accessibilityLabel="Open menu">
          <Ionicons name="menu-outline" size={30} color="#2d2d30" />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={24} color="#5f5f63" />
          <Text style={styles.searchText}>Search for Pokémon...</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#2a2a2f" />
          <Text style={styles.loadingText}>Loading Pokédex…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={pokemon}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PokemonCard
              name={item.name}
              image={item.image}
              number={item.id}
              isFavorite={Boolean(favorites[item.name])}
              toggleFavorite={toggleFavorite}
              onPress={() => navigation.navigate('Details', { pokemonName: item.name })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function DetailsScreen({ route, navigation }) {
  const { pokemonName } = route.params || {};
  const { favorites, toggleFavorite } = useContext(FavoritesContext);
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchPokemonDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_BASE}/pokemon/${pokemonName}`);
        if (!response.ok) {
          throw new Error('Unable to load Pokémon details');
        }

        const data = await response.json();

        if (isMounted) {
          setPokemon(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message || 'Something went wrong');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (pokemonName) {
      fetchPokemonDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [pokemonName]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2a2a2f" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  if (!pokemon) {
    return null;
  }

  const types = pokemon.types.map((entry) => entry.type.name);
  const primaryColor = typeColors[types[0]] || '#b7b3c7';

  return (
    <View style={styles.detailRoot}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={32} color="#2d2d30" />
        </Pressable>
        <Pressable
          hitSlop={12}
          onPress={() => toggleFavorite(pokemon.name)}
          accessibilityLabel={favorites[pokemon.name] ? `Remove ${pokemon.name} from favorites` : `Add ${pokemon.name} to favorites`}
        >
          <Ionicons
            name={favorites[pokemon.name] ? 'heart' : 'heart-outline'}
            size={30}
            color={favorites[pokemon.name] ? '#ff5d7a' : '#ffffff'}
          />
        </Pressable>
      </View>

      <View style={[styles.heroShell, { backgroundColor: primaryColor }]}>
        <View style={styles.heroCircle}>
          <Image
            source={{ uri: pokemon.sprites.other['official-artwork'].front_default }}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailName}>{titleCase(pokemon.name)}</Text>
        <Text style={styles.detailNumber}>{formatNumber(pokemon.id)}</Text>

        <View style={styles.typeRow}>
          {types.map((typeName) => (
            <View
              key={typeName}
              style={[styles.typeBadge, { backgroundColor: typeColors[typeName] || '#a8a77a' }]}
            >
              <Text style={styles.typeBadgeText}>{titleCase(typeName)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Weight</Text>
            <Text style={styles.infoValue}>{(pokemon.weight / 10).toFixed(1)} kg</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Height</Text>
            <Text style={styles.infoValue}>{(pokemon.height / 10).toFixed(1)} m</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AboutScreen() {
  return (
    <View style={styles.aboutContainer}>
      <Text style={styles.aboutTitle}>About</Text>
      <Text style={styles.aboutText}>
        A simple, mobile-friendly Pokédex that pulls live Pokémon data from the public PokéAPI.
      </Text>
    </View>
  );
}

function DrawerContent({ navigation }) {
  const menuItems = [
    { label: 'Settings', icon: 'settings-outline' },
    { label: 'Help and Support', icon: 'help-circle-outline' },
    { label: 'Logout', icon: 'log-out-outline' },
  ];

  return (
    <View style={styles.drawerContent}>
      <Text style={styles.drawerTitle}>Menu</Text>
      {menuItems.map((item) => (
        <Pressable
          key={item.label}
          style={styles.drawerItemRow}
          onPress={() => navigation.navigate(item.label.replace(/\s+/g, ''))}
        >
          <Ionicons name={item.icon} size={22} color="#2d2d30" />
          <Text style={styles.drawerItem}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PlaceholderScreen({ route }) {
  return (
    <View style={styles.aboutContainer}>
      <Text style={styles.aboutTitle}>{route.name}</Text>
      <Text style={styles.aboutText}>This section is ready for future content.</Text>
    </View>
  );
}

function HomeTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeList" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === 'Home' ? 'home-outline' : 'information-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2d2d30',
        tabBarInactiveTintColor: '#8d8d8d',
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Home" component={HomeTabs} />
      <Tab.Screen name="About" component={AboutScreen} />
    </Tab.Navigator>
  );
}

function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState({});

  const toggleFavorite = (name) => {
    setFavorites((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export default function App() {
  return (
    <FavoritesProvider>
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: styles.drawer,
            drawerLabelStyle: styles.drawerLabel,
          }}
        >
          <Drawer.Screen name="MainTabs" component={MainTabs} />
          <Drawer.Screen name="Settings" component={PlaceholderScreen} />
          <Drawer.Screen name="HelpandSupport" component={PlaceholderScreen} />
          <Drawer.Screen name="Logout" component={PlaceholderScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </FavoritesProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef0f5',
  },
  topRow: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  searchContainer: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#d0d0d5',
    backgroundColor: '#f5f5f7',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  searchText: {
    fontSize: 22,
    color: '#6d6d73',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 14,
  },
  card: {
    backgroundColor: '#e8e6ec',
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 150,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardTextArea: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#282a2f',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2b2a2d',
    marginBottom: 10,
  },
  typeWrap: {
    alignSelf: 'flex-start',
  },
  typePill: {
    backgroundColor: '#d1d6dc',
    color: '#27333a',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  imageArea: {
    width: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardImage: {
    width: 138,
    height: 138,
  },
  favoriteButton: {
    position: 'absolute',
    right: 10,
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: '#303236',
  },
  emptyText: {
    fontSize: 18,
    color: '#3d3f43',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#edf0f4',
  },
  detailRoot: {
    flex: 1,
    backgroundColor: '#eef0f4',
  },
  headerRow: {
    position: 'absolute',
    zIndex: 2,
    top: 24,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroShell: {
    height: 320,
    borderBottomLeftRadius: 52,
    borderBottomRightRadius: 52,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCircle: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: 300,
    height: 300,
  },
  detailContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  detailName: {
    fontSize: 54,
    fontWeight: '800',
    color: '#2a2a2d',
  },
  detailNumber: {
    fontSize: 24,
    color: '#4b4d51',
    marginBottom: 18,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#f1f2f5',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    minHeight: 100,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 16,
    textTransform: 'uppercase',
    color: '#5d5d63',
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#26282d',
  },
  aboutContainer: {
    flex: 1,
    backgroundColor: '#edf0f4',
    justifyContent: 'center',
    padding: 22,
  },
  aboutTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2a2b2d',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 20,
    color: '#40444c',
    lineHeight: 30,
  },
  drawer: {
    width: 260,
    backgroundColor: '#f4f4f6',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#f4f4f6',
    padding: 22,
    justifyContent: 'center',
  },
  drawerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2a2a2d',
    marginBottom: 26,
  },
  drawerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  drawerItem: {
    fontSize: 20,
    color: '#3a3c40',
  },
  drawerLabel: {
    fontSize: 18,
    color: '#2d2d30',
  },
  tabBar: {
    backgroundColor: '#f8f8fa',
    borderTopWidth: 0,
    height: 74,
    paddingBottom: 8,
    paddingTop: 8,
  },
});
