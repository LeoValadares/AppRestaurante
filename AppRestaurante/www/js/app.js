// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var db;

angular.module('AppRestaurante', ['ionic', 'ngCordova'])

.run(function($ionicPlatform, $cordovaSQLite) {
  $ionicPlatform.ready(function() {
	 if(window.cordova && window.cordova.plugins.Keyboard) {
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

		// Don't remove this line unless you know what you are doing. It stops the viewport
		// from snapping when text inputs are focused. Ionic handles this internally for
		// a much nicer keyboard experience.
		cordova.plugins.Keyboard.disableScroll(true);
	 }
	 if(window.StatusBar) {
		StatusBar.styleDefault();
	 }

	 //cria banco sqlite para mobile ou websql para teste browser
	if(window.cordova) 
	{
      	//SQLite
      	db = $cordovaSQLite.openDB("appRestaurante.db");
    } 
    else 
    {
    	//WEBSql
    	db = window.openDatabase("appRestaurante.db", "1.0", "App Restaurante", -1);
    }
    //Criando as tabelas para a primeira inicialização
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS usuarios (id integer primary key autoincrement, nome text not null unique, senha text not null)");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS produtos (id integer primary key autoincrement, nome text not null unique, preco real not null)");
    $cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO produtos (nome, preco) VALUES ("Coca", 10.99)');
    $cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO produtos (nome, preco) VALUES ("Pepsi", 7.99)');
    $cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO produtos (nome, preco) VALUES ("Dolly", 5.99)');
  });
})

.config(function($stateProvider, $urlRouterProvider)
{
  	$stateProvider

	  	.state('login', {
			url: '/login/:retry?',
			templateUrl: 'templates/login.html',
			controller: 'LoginController'
		})

		.state('verPedidos', {
			url: '/verPedidos/:acao',
			templateUrl: 'templates/pedidos.html'
		})

		.state('main', {
			url: 'main',
			templateUrl: 'templates/main.html'
		})

		.state('estoque', {
			url: "estoque",
			templateUrl: 'templates/estoque.html'
		})

		.state('abrirPedido', {
			url: "abrirPedido",
			templateUrl: 'templates/abrirPedido.html'
		})

		.state('adicionarItens', {
			url: "adicionarItens/:idPedido",
			templateUrl: 'templates/adicionarItens.html'
		})

		.state('fecharPedido', {
			url: "fecharPedido/:tipo/:objetoId",
			templateUrl: 'templates/fecharPedido.html'
		})

		.state('cadastrarProduto', {
			url: "cadastrarProduto",
			templateUrl: 'templates/cadastrarProduto.html',
			controller: 'CadastrarProdutoController'
		})

		.state('listaFaturamentos', {
			url: "listaFaturamentos",
			templateUrl: 'templates/listaFaturamentos.html'
		})

	$urlRouterProvider.otherwise('/login/')
})

.service("LoginService", function($cordovaSQLite, $q) 
{
	this.usuarios = [
		{'id': 1,
			'nome': 'jose',
			'senha' : '123'},
	];

	this.usuarioLogado = null;

	// this.checarUsuario = function(nomeUsuario, senha) 
	// {
	// 	var objetoUsuario = null;
	// 	this.usuarios.forEach(function(usuario)
	// 	{
	// 		if(usuario.nome == nomeUsuario && usuario.senha == senha)
	// 		{
	// 			objetoUsuario = usuario;
	// 			return;
	// 		}
	// 	})
	// 	return objetoUsuario;
	// };

	this.checarUsuario = function(nomeUsuario, senha) 
	{	
		var q = $q.defer();
		$cordovaSQLite.execute(db, "SELECT * FROM usuarios WHERE nome = ? and senha = ?", [nomeUsuario, senha]).then(function(res) {
			if(res.rows.length > 0)
			{
				q.resolve(res.rows.item(0));
			}
			else
			{
				q.reject(res);
			}
		})
		return q.promise;
	};
})

//Serviço angular que implementa o controle de estoque.
//Único para o aplicativo inteiro
.service("ProdutoService", function ($cordovaSQLite, $q) 
{
	// this.produtos = [
	// 	{'id': 1,
	// 		'nome': 'Coca',
	// 		'preco': 10.99},
	// 	{'id': 2,
	// 		'nome': 'Pepsi',
	// 		'preco': 7.99},
	//  	{'id': 3,
	//  		'nome': 'Dolly',
	// 		'preco': 5.99},
	// ];

	this.produtos = function() 
	{
		var q = $q.defer();
		var arrayProdutos = [];
		$cordovaSQLite.execute(db, "SELECT id, nome, preco FROM produtos").then(function(res) {
			for (var i = 0; i < res.rows.length; i++) {
				arrayProdutos.push(res.rows.item(i));
			}
			q.resolve(arrayProdutos);
		})
		return q.promise;
	}

	// this.adicionarProduto = function(nomeProduto, valorProduto) 
	// {
	// 	this.produtos.push({'id': this.idTracker, 'nome': nomeProduto, 'preco': valorProduto});
	// 	this.idTracker++;
	// };

	this.adicionarProduto = function(nomeProduto, valorProduto) 
	{	
		$cordovaSQLite.execute(db, "INSERT OR IGNORE INTO produtos (nome, preco) VALUES (?,?)", [nomeProduto, valorProduto]);
	};

	// this.getProduto = function(idProduto) 
	// {
	// 	var produtoBuscado = null;
	// 	this.produtos.forEach(function(element) 
	// 	{
	// 		if(element.id == idProduto)
	// 		{
	// 			produtoBuscado = element;
	// 			return;
	// 		}
	// 	})
	// 	return produtoBuscado;
	// };

	this.getProduto = function(idProduto) 
	{
		var q = $q.defer();
		var objetoPedido;
		$cordovaSQLite.execute(db, "SELECT id, nome, preco FROM produtos WHERE id = ?", [idProduto]).then(function(res) 
		{
			objetoPedido = res.rows.item(0) ;
			q.resolve(objetoPedido);
		})
		return q.promise;
	};
})

//Serviço encarregado de gerenciar as mesas
.service("MesaService", function()
{
	this.mesas = [
		{'id': 1,
			'capacidade': 2},
		{'id': 2,
			'capacidade': 4},
		{'id': 3,
			'capacidade': 8}
	];
})

//Serviço encarregado de gerenciar pedidos
.service("PedidoService", function() 
{
	this.idTracker = 1;
	this.pedidos = [];

	this.abrirPedido = function(nomeCliente, idMesa, nomeGarcom) 
	{
		var novoPedido = {'id': this.idTracker, 'nomeCliente': nomeCliente, 'idMesa': idMesa, 'nomeGarcom': nomeGarcom, 'horaInicio': (new Date).toUTCString(), 'itens': []};
		this.pedidos.push(novoPedido);
		this.idTracker++;
	};

	this.getPedido = function getPedido(id) 
	{
		var objetoPedido = null;
		var indexObjeto = -1;
		this.pedidos.forEach(function(element, index) 
		{
			if(element.id == id)
			{
				objetoPedido = element;
				indexObjeto = index
				return;
			}
		})
		return {'index': indexObjeto, 'objetoPedido': objetoPedido};
	};

	//procura pedido pelo id da mesa, remove ele do array pedidos e retorna o objeto correspondente ao pedido
	this.fecharPedido = function(idPedido) 
	{
		var objetoPedido = this.getPedido(idPedido);
		if(objetoPedido.objetoPedido != null)
		{
			// objetoPedido = this.pedidos[idPedido];
			this.pedidos.splice(objetoPedido.index, 1);
			console.log(objetoPedido);
			return objetoPedido.objetoPedido;
		}
	};
})

//Serviço encarregado de gerenciar pedidos
.service("FaturamentoService", function() 
{
	this.idTracker = 1;
	this.pedidosFaturados = [
	];

	this.getFaturamento = function(faturamentoId) 
	{
		var faturamentoSelecionado = null;
		this.pedidosFaturados.forEach(function(faturamento) {
			if (faturamentoId == faturamento.id) 
			{
				faturamentoSelecionado = faturamento;
				return;
			};
		})
		return faturamentoSelecionado;
	};

	this.faturarPedido = function(pedido) 
	{
		var pedidoFaturado = {'id': this.idTracker, 'horaFechamento': (new Date).toUTCString(), 'pedido': pedido};
		this.pedidosFaturados.push(pedidoFaturado);
		this.idTracker++;
		console.log(pedidoFaturado);
	}
})

.controller("LoginController", function($scope, $state, $stateParams, $cordovaSQLite, LoginService) 
{
	//caso seja um retry passa a mensagem ao usuário para que este corrija usuário e senha
	if($stateParams.retry == 'true')
	{
		$scope.retryMessage = "Dados de login inválidos, tente novamente.";
	}
	
	//funça que executa o login do usuário	
	// $scope.logarUsuario = function(nomeUsuario, senha) 
	// {
	// 	var objetoUsuario = LoginService.checarUsuario(nomeUsuario, senha);
	// 	console.log("LOGIN CONTROLLER");
	// 	console.log(objetoUsuario);
	// 	if(objetoUsuario != null)
	// 	{
	// 		//caso o login seja bem sucedido transfere o usuário para o menu principal do app
	// 		LoginService.usuarioLogado = objetoUsuario;
	// 		$state.go('main');
	// 	}
	// 	else
	// 	{
	// 		//caso não retorna à tela de login indicando um retry
	// 		$state.go('login', {'retry' : true});
	// 	}
	// };

	$scope.logarUsuario = function(nomeUsuario, senha) 
	{
		LoginService.checarUsuario(nomeUsuario, senha).then(function(res) 
		{
			LoginService.usuarioLogado = res;
			console.log(LoginService.usuarioLogado);
			$state.go('main')
		}, 
		function(err) 
		{
			console.error(err);
			$state.go('login', {'retry' : true});
		})
	};

	// $scope.logarUsuario = function(nomeUsuario, senha) {
	// 	return $cordovaSQLite.execute(db, "SELECT * FROM usuarios where nome = ?", [nomeUsuario]).then(function(res) {
	// 		console.log(res.rows.length);
	// 		if(res.rows.length > 0)
	// 		{
	// 			console.log(res.rows.item(0));
	// 			instanciaUsuario = res.rows.item(0);
	// 			$state.go('main');
	// 			return instanciaUsuario;
	// 			console.log(instanciaUsuario);
	// 		}
	// 	});
	// }
})

//Controlador para a view estoque
.controller("EstoqueListController", function($scope, ProdutoService)
{
	//$scope.listaDeProdutos = [];
	ProdutoService.produtos().then(function(res) {$scope.listaDeProdutos = res;});
})

.controller("AbrirPedidoController", function($scope, LoginService, PedidoService, MesaService) 
{
	$scope.abrirPedido = function(nomeCliente, idMesa) 
	{
		console.log(LoginService);
		PedidoService.abrirPedido(nomeCliente, idMesa, LoginService.usuarioLogado.nome);
	};

	//função que valida se a mesa está livre
	//vamos com calma
	$scope.validarMesa = function(idMesa) 
	{
		//percorre o array de mesas verificando se o idMesa passado corresponde a um numero de mesa
		for (var i = 0; i < MesaService.mesas.length; i++) 
		{
			//id existe, blz, vamos verificar agora se nenhum pedido está associado a mesa idMesa
			if(idMesa == MesaService.mesas[i].id)
			{
				//percorre o vetor pedidos verificando se nenhum pedido está associado aquela mesa
				for (var j = PedidoService.pedidos.length - 1; j >= 0; j--) 
				{
					if(idMesa == PedidoService.pedidos[j].idMesa)
					{
						//retorna falso já que o id da mesa já está associado com um pedido
						return false;
					}
				}
				//ele percorreu os pedidos e n achou nenhum pedido na mesa informada retorna verdadeiro, é válido associar uma conta aquela mesa
				return true;
			}
		}
		//se o programa caiu aqui é pq n existe nenhuma mesa com o id indicado
		return false;
	};
})

.controller("VerPedidosController", function($scope, $stateParams, PedidoService)
{
	$scope.acao = $stateParams.acao;
	console.log($scope.acao);
	$scope.listaDePedidos = PedidoService.pedidos;
})

.controller("ListarFaturamentosController", function($scope, FaturamentoService) 
{
	$scope.faturamentos = FaturamentoService.pedidosFaturados;
})

.controller("FecharPedidoController", function($scope, $stateParams, FaturamentoService, PedidoService)
{
	$scope.tipoDeObjeto = $stateParams.tipo;
	$scope.objetoId = $stateParams.objetoId;
	if($scope.tipoDeObjeto == 'pedido')
	{
		$scope.pedidoSelecionado = PedidoService.getPedido($scope.objetoId).objetoPedido;
	}
	else if ($scope.tipoDeObjeto == 'faturamento')
	{
		$scope.objetoFaturamento = FaturamentoService.getFaturamento($scope.objetoId);

		$scope.faturamentoSelecionado = $scope.objetoFaturamento;
		$scope.pedidoSelecionado = 	$scope.objetoFaturamento.pedido;
	}

	$scope.faturarPedido = function(idPedido) 
	{
		FaturamentoService.faturarPedido(PedidoService.fecharPedido(idPedido));
		console.log(FaturamentoService.pedidosFaturados);
	};

	//calcula o valor total do pedido
	$scope.calcularTotal = function(pedido) 
	{
		var valorTotal = 0;
		//percorre os itens pedidos e vai somando o valor
		pedido.itens.forEach(function(element) 
		{
			valorTotal += element.preco * element.quantidade;
		})
		return valorTotal;
	}
})

.controller("AdicionarItemController", function($scope, $stateParams, PedidoService, ProdutoService) 
{
	$scope.idPedido = $stateParams.idPedido;
	ProdutoService.produtos().then(function(res) {$scope.listaDeProdutos = res;});
	
	//adiciona o produto especificado à lista de itens do pedido especificado
	$scope.adicionarItem = function(idProduto, idPedido) 
	{
		//clona o produto selecionado para ser inserido no array de itens do pedido
		//ou para ser comparado com os itens já existentes
		ProdutoService.getProduto(idProduto).then(function(produtoSelecionado) 
		{
			var pedidoSelecionado = PedidoService.getPedido(idPedido).objetoPedido;
			var entradaItem = null;

			pedidoSelecionado.itens.forEach(function(produto)
			{
				if(produto.id == idProduto)
				{
					entradaItem = produto;
					return;
				}
			});

			//caso já exista, incremente a quantidade daquele produto no pedido
			if (entradaItem != null)
			{
				entradaItem.quantidade++;
			}
			//caso não, insira o produto selecionado com a quantidade 1 nos itens do pedido
			else
			{
				produtoSelecionado['quantidade'] = 1;
				pedidoSelecionado.itens.push(produtoSelecionado);
			}
		})
	};
})

.controller("CadastrarProdutoController", function($scope, ProdutoService)
{
	$scope.adicionarProduto = function(nomeProduto, valorProduto) 
	{
		ProdutoService.adicionarProduto(nomeProduto, valorProduto);
	};
});






