<?php

namespace App\Controllers;

use App\Models\CategoryModel;
use CodeIgniter\RESTful\ResourceController;

class Categories extends ResourceController
{
    protected $modelName = CategoryModel::class;
    protected $format    = 'json';

    // GET /categories
    public function index()
    {
        return $this->respond($this->model->findAll());
    }

    // GET /categories/(:any)
    public function show($id = null)
    {
        $data = $this->model->find($id);
        if (!$data) {
            return $this->failNotFound('Kategori tidak ditemukan');
        }
        return $this->respond($data);
    }

    // POST /categories
    public function create()
    {
        $data = $this->request->getJSON(true);
        if (!$data) {
            $data = $this->request->getPost();
        }

        if (!$this->model->insert($data)) {
            return $this->fail($this->model->errors());
        }

        // Return the created resource
        $created = $this->model->find($data['id']);
        return $this->respondCreated($created, 'Kategori berhasil ditambahkan');
    }

    // PUT /categories/(:any)
    public function update($id = null)
    {
        $data = $this->request->getJSON(true);
        if (!$data) {
            $data = $this->request->getRawInput();
        }

        if (!$this->model->find($id)) {
            return $this->failNotFound('Kategori tidak ditemukan');
        }

        if (!$this->model->update($id, $data)) {
            return $this->fail($this->model->errors());
        }

        return $this->respond($this->model->find($id), 200, 'Kategori berhasil diperbarui');
    }

    // DELETE /categories/(:any)
    public function delete($id = null)
    {
        if (!$this->model->find($id)) {
            return $this->failNotFound('Kategori tidak ditemukan');
        }

        $this->model->delete($id);
        return $this->respondDeleted(['id' => $id], 'Kategori berhasil dihapus');
    }
}
