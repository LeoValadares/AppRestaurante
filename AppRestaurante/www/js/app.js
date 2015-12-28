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
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS mesas (id integer primary key autoincrement, capacidade int)");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS pedidos (id integer primary key autoincrement, idMesa int references mesas(id), nomeGarcom text not null, nomeCliente text, horaInicio text not null, horaFechamento text, status text not null)");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS item_pedido (id integer primary key autoincrement, idPedido int references pedidos(id), idProduto int references produtos(id))");

    $cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO usuarios (nome, senha) VALUES ("teste", "123")');

    $cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO produtos (nome, preco) VALUES ("Coca", 10.99)');
    $cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO produtos (nome, preco) VALUES ("Pepsi", 7.99)');
    $cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO produtos (nome, preco) VALUES ("Dolly", 5.99)');
    
    $cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO mesas (id, capacidade) VALUES (1,2)');
	$cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO mesas (id, capacidade) VALUES (2,4)');
	$cordovaSQLite.execute(db, 'INSERT OR IGNORE INTO mesas (id, capacidade) VALUES (3,8)');
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
	this.usuarioLogado = null;

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

//Serviço angular que implementa o controle de produtos.
.service("ProdutoService", function ($cordovaSQLite, $q) 
{
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

	this.adicionarProduto = function(nomeProduto, valorProduto) 
	{	
		$cordovaSQLite.execute(db, "INSERT OR IGNORE INTO produtos (nome, preco) VALUES (?,?)", [nomeProduto, valorProduto]);
	};

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
.service("MesaService", function($cordovaSQLite, $q)
{
	//checa se a mesa está livre
	this.checarMesaLivre = function(idMesa) 
	{
		var q = $q.defer();
		//checa se o id da mesa existe
		$cordovaSQLite.execute(db, "SELECT id FROM mesas WHERE id = ? AND id NOT IN (SELECT idMesa FROM pedidos WHERE status = 'aberto')", [idMesa]).then(function(res) {
			if(res.rows.length > 0)
			{
				//retorna verdadeiro caso o id da mesa exista;
				q.resolve(res.rows.item(0));
			}
			else
			{
				q.reject();
			}
		}, function(err) {console.error(err)});

		return q.promise;
	};
})

//Serviço encarregado de gerenciar pedidos
.service("PedidoService", function($cordovaSQLite, $q) 
{
	this.pedidos = function() 
	{
		var q = $q.defer();
		var arrayPedidos = [];
		$cordovaSQLite.execute(db, "SELECT id, nomeCliente, idMesa, nomeGarcom, horaInicio FROM pedidos WHERE status = 'aberto'").then(
			function(res) 
			{
				for (var i = 0; i < res.rows.length; i++) {
					arrayPedidos.push(res.rows.item(i));
				};
				q.resolve(arrayPedidos);
			});
		return q.promise;
	};

	this.abrirPedido = function(nomeCliente, idMesa, nomeGarcom) 
	{
		$cordovaSQLite.execute(db, "INSERT OR IGNORE INTO pedidos (nomeCliente, idMesa, nomeGarcom, horaInicio, status) VALUES (?,?,?,?,?)", 
			[nomeCliente, idMesa, nomeGarcom, (new Date).toUTCString(), 'aberto']).then(
			function(res)
			{
				console.log("INSERT RES");
				console.log(res);
			},
			function(err) 
			{
				console.log("INSERT ERR");
				console.log(err);
			});
	};

	this.getPedido = function(pedidoId) 
	{
		var q = $q.defer();
		$cordovaSQLite.execute(db, "SELECT id, nomeCliente, idMesa, nomeGarcom, horaInicio FROM pedidos WHERE id = ?", [pedidoId]).then(
			function(res) 
			{
				q.resolve(res.rows.item(0));	
			},
			function(err) 
			{
				q.reject(err);
			})
		return q.promise;
	};

	this.fecharPedido = function(idPedido) 
	{
		$cordovaSQLite.execute(db, "UPDATE pedidos SET status = 'fechado', horaFechamento = ? WHERE id = ?", [(new Date).toUTCString(), idPedido]).then(
			function(res) {console.log(res)}, function(err) {
				console.log(err)
			});
	};
})

.service("ItemPedidoService", function($cordovaSQLite, $q) 
{
	this.adicioarItemPedido = function(idProduto, idPedido) 
	{
		$cordovaSQLite.execute(db, "INSERT INTO item_pedido (idProduto, idPedido) VALUES (?,?)", [idProduto, idPedido]);
	};

	this.getItensPedido = function(idPedido) 
	{
		var q = $q.defer();
		var arrayItensPedido = [];
		$cordovaSQLite.execute(db, ("select item_pedido.id as item_pedido_Id, idPedido, idProduto, nome, preco, count(idProduto) as quantidade from item_pedido inner join produtos on item_pedido.idProduto = produtos.id where idPedido = ? group by idProduto"), [idPedido]).then(
			function(res) 
			{
				for (var i = 0; i < res.rows.length; i++) {
					arrayItensPedido.push(res.rows.item(i));
				}
				q.resolve(arrayItensPedido);
			}, function(err) {console.error(err);});
		return q.promise;
	};
})

//Serviço encarregado de gerenciar pedidos
.service("FaturamentoService", function($cordovaSQLite, $q) 
{
	this.pedidosFaturados = function() 
	{
		var q = $q.defer();
		var arrayFaturamentos = [];
		$cordovaSQLite.execute(db, "SELECT id, nomeCliente, nomeGarcom, horaFechamento FROM pedidos where status = 'fechado'").then(function(res) {
			for (var i = 0; i < res.rows.length; i++) {
				arrayFaturamentos.push(res.rows.item(i));
			};
			q.resolve(arrayFaturamentos);
		})
		return q.promise;
	};

	this.getFaturamento = function(faturamentoId) 
	{
		var q = $q.defer();
		$cordovaSQLite.execute(db, "SELECT id, nomeCliente, nomeGarcom, idMesa, horaInicio, horaFechamento FROM pedidos where status = 'fechado' and id = ?", [faturamentoId]).then(
			function(res) {
				q.resolve(res.rows.item(0));
			})
		return q.promise;
	};
})

.controller("LoginController", function($scope, $state, $stateParams, $cordovaSQLite, LoginService) 
{
	//caso seja um retry passa a mensagem ao usuário para que este corrija usuário e senha
	if($stateParams.retry == 'true')
	{
		$scope.retryMessage = "Dados de login inválidos, tente novamente.";
	}

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
})

//Controlador para a view estoque
.controller("EstoqueListController", function($scope, ProdutoService, MesaService)
{
	ProdutoService.produtos().then(function(listaDeProdutos) {
		$scope.listaDeProdutos = listaDeProdutos;});
})

.controller("AbrirPedidoController", function($scope, $state, LoginService, PedidoService, MesaService) 
{
	$scope.mesaValida = false;
		
	MesaService.checarMesaLivre($scope.numeroMesa).then(function(res) 
	{
		$scope.mesaValida = true;
	})

	$scope.abrirPedido = function(nomeCliente, idMesa) 
	{
		console.log(nomeCliente + " " + idMesa);
		MesaService.checarMesaLivre(idMesa).then(function(res) 
		{
			console.log(res);
			PedidoService.abrirPedido(nomeCliente, idMesa, LoginService.usuarioLogado.nome);
			$state.go('main');
		},
		function(err) 
		{
			alert("Mesa inválida ou ocupada.");
		});
	};
})

.controller("VerPedidosController", function($scope, $stateParams, PedidoService)
{
	PedidoService.pedidos().then(function(res) {
		$scope.listaDePedidos = res;
	});
	$scope.acao = $stateParams.acao;

})

.controller("ListarFaturamentosController", function($scope, FaturamentoService) 
{
	FaturamentoService.pedidosFaturados().then(function(pedidosFaturados) {
		$scope.faturamentos = pedidosFaturados;
	});
})

.controller("FecharPedidoController", function($scope, $stateParams, FaturamentoService, PedidoService, ItemPedidoService)
{
	$scope.tipoDeObjeto = $stateParams.tipo;
	$scope.objetoId = $stateParams.objetoId;

	//caso o item selecionado seja um pedido aberto, busque-o no em PedidoService
	if($scope.tipoDeObjeto == 'pedido')
	{
		PedidoService.getPedido($scope.objetoId).then(function(res) {
			$scope.pedidoSelecionado = res;
		});
	}
	//caso o item selecionado seja um pedido faturado, busque-o em FaturamentoService
	else if ($scope.tipoDeObjeto == 'faturamento')
	{
		FaturamentoService.getFaturamento($scope.objetoId).then(function(res) {
			$scope.pedidoSelecionado = res;
		});
	}

	//Carrega os itens associados ao pedido pelo serviço ItemPedidoService
	ItemPedidoService.getItensPedido($scope.objetoId).then(function(itensPedido) {
		console.log(itensPedido);
		$scope.pedidoSelecionado.itens = itensPedido;
	});

	$scope.fecharPedido = function(idPedido) 
	{
		PedidoService.fecharPedido(idPedido);
	};

	//recebe um array de produtos e calcula o valor total
	$scope.calcularTotal = function(itensPedido) 
	{
		var valorTotal = 0;
		if(itensPedido != undefined || itensPedido != null)
		{
			//soma os totais parcias do valor dos itens
			itensPedido.forEach(function(element)
			{
				valorTotal += element.preco * element.quantidade;
			});
		}
		return valorTotal;
	}
})

.controller("AdicionarItemController", function($scope, $stateParams, ProdutoService, ItemPedidoService) 
{
	$scope.idPedido = $stateParams.idPedido;
	ProdutoService.produtos().then(function(res) {$scope.listaDeProdutos = res;});
	
	//adiciona o produto especificado à lista de itens do pedido especificado
	$scope.adicionarItem = function(idProduto, idPedido) 
	{
		ItemPedidoService.adicioarItemPedido(idProduto, idPedido);
	};
})

.controller("CadastrarProdutoController", function($scope, ProdutoService)
{
	$scope.adicionarProduto = function(nomeProduto, valorProduto) 
	{
		ProdutoService.adicionarProduto(nomeProduto, valorProduto);
	};
});